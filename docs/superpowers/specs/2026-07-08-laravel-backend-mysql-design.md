# Laravel Backend (MySQL) — Design Spec

> **Tanggal:** 2026-07-08
> **Branch:** `laravel-backend-mysql`
> **Status:** Disetujui, siap masuk fase perencanaan implementasi (writing-plans)

## 1. Latar Belakang & Tujuan

Backend saat ini (`server/`, Express + `mysql2`) sudah jalan dan ter-smoke-test terhadap MySQL remote di hPanel (lihat `docs/superpowers/specs/2026-07-07-mysql-remote-backend-design.md`). Pemilik proyek ingin mengeksplorasi Laravel sebagai backend alternatif karena tooling bawaannya (Eloquent, migrations, artisan, validation) membuat development lebih cepat dan mudah dibanding Express yang ditulis manual (raw SQL query di `repo.js`).

Tujuan branch ini: **mengganti Express sepenuhnya** dengan Laravel sebagai backend utama ke depan — tapi dikerjakan bertahap. Fase ini (fase 1) hanya mencakup fondasi + 2 entity inti (`rooms`, `tenants`) untuk memvalidasi pola sebelum melanjutkan ke `bills`, `expenses`, `complaints`, `settings` di fase berikutnya.

## 2. Cakupan Fase 1

**Termasuk:**
- Koneksi Laravel ke MySQL remote hPanel yang sama dengan Express (tabel `kostos_*` yang sudah ada & terisi data)
- Model Eloquent: `Room`, `Tenant` (API publik) + `Bill`, `Setting` (dipakai internal saja, belum ada endpoint publik)
- Endpoint API: CRUD `rooms`, CRUD-terbatas `tenants` (create, move-out, delete) — mirror behavior persis dari `server/routes/rooms.js` dan `server/routes/tenants.js`
- Business rule cross-entity: tenant masuk → flip room + auto-create bill pertama; tenant keluar → hapus bill belum lunas + bebaskan room + hapus tenant
- Feature test manual (bukan CI) dengan teardown eksplisit, aman dijalankan terhadap DB bersama

**Tidak termasuk (fase lanjutan):**
- Endpoint publik untuk `bills`, `expenses`, `complaints`, `settings`
- Wiring frontend React ke Laravel (proxy Vite tetap ke Express)
- Auth/Sanctum
- Deprecation/penghapusan `server/` (Express)

## 3. Struktur Repo

```
kostweb/
├── server/       # Express — TIDAK DIUBAH, tetap dipakai frontend sampai fase lanjutan selesai
├── backend/      # Laravel — baru, dibangun di fase ini
└── src/          # React frontend — TIDAK DIUBAH di fase ini
```

`backend/` sudah ter-scaffold sebelumnya (`laravel new`, Laravel 12, PHP ^8.2, vendor sudah ter-install) tapi masih skeleton default (belum pernah di-commit). Skeleton ini jadi starting point.

## 4. Koneksi Database

`backend/.env` diisi kredensial yang **sama** dengan `server/.env` (disalin, bukan dari `.env.example`):

```
DB_CONNECTION=mysql
DB_HOST=153.92.15.45
DB_PORT=3306
DB_DATABASE=u330327941_nxSGS
DB_USERNAME=<sama seperti server/.env>
DB_PASSWORD=<sama seperti server/.env>
```

Tabel `kostos_rooms`, `kostos_tenants`, `kostos_bills`, `kostos_settings` **sudah ada dan terisi data** (dibuat & di-seed oleh Express, lihat `server/db.js`). Laravel **tidak boleh** mengelola skema tabel-tabel ini secara destruktif:
- Migration dibuat idempoten (`Schema::hasTable()` guard) untuk dokumentasi/fresh-env, tapi di DB remote ini akan jadi no-op karena tabel sudah ada.
- **Tidak pernah** menjalankan `migrate:fresh`, `migrate:refresh`, atau `RefreshDatabase`/`DatabaseMigrations` test trait terhadap DB ini — DB dipakai bersama WordPress & aplikasi ERP Laravel lain di luar proyek ini.

## 5. Model Eloquent

Skema tabel existing (lihat `server/db.js`) tidak mengikuti konvensi default Laravel, jadi tiap model butuh override:

| Aspek | Default Laravel | Override yang dipakai |
|---|---|---|
| Primary key | `id` bigint auto-increment | `$incrementing = false; protected $keyType = 'string';` (id string, mis. `room-a01`) |
| Timestamps | `created_at`/`updated_at` | `public $timestamps = false;` (kolom tidak ada) |
| Nama kolom | snake_case | Tetap camelCase asli (`tenantId`, `roomAssigned`, `moveInDate`, dst) — didaftarkan di `$fillable` |
| Kolom JSON | — | `$casts` untuk `facilities` (Room) dan `emergencyContact` (Tenant) → `array` |

Model yang dibuat:
- `App\Models\Room` — tabel `kostos_rooms`, urut tampil pakai kolom `seq`
- `App\Models\Tenant` — tabel `kostos_tenants`, urut tampil pakai kolom `seq`
- `App\Models\Bill` — tabel `kostos_bills`, **internal only** (dipakai controller Tenant untuk auto-create/auto-delete bill), belum ada route publik
- `App\Models\Setting` — tabel `kostos_settings`, baris tunggal `id=1`, **internal only** (baca `defaultDueDateDay`, fallback `5` kalau baris belum ada — mirror `getSettings()` di `server/repo.js`)

## 6. API Routes & Business Rules

Didaftarkan di `routes/api.php`, prefix `/api`, tanpa auth (mirror Express yang juga belum ada auth di level API).

```
GET    /api/rooms
POST   /api/rooms
PATCH  /api/rooms/{id}
DELETE /api/rooms/{id}

GET    /api/tenants
POST   /api/tenants
POST   /api/tenants/{id}/move-out
DELETE /api/tenants/{id}
```

### RoomController
CRUD 1:1 dengan `server/routes/rooms.js`:
- `index` — list semua room urut `seq`
- `store` — upsert langsung dari body
- `update` — ambil row by id (404 `{error: 'Kamar tidak ditemukan'}` kalau tak ada), merge field dari body (partial update), simpan
- `destroy` — hapus by id

### TenantController
Business rule cross-entity dipindah persis dari `server/routes/tenants.js`, dibungkus `DB::transaction()` (perbaikan dibanding Express yang tidak transactional — tidak mengubah kontrak API):

- `store` (mirror `handleAddTenant`):
  1. Simpan tenant
  2. Cari room yang `id` atau `number` cocok dengan `roomAssigned` tenant
  3. Kalau ketemu: set room `status = 'Terisi'`, `tenantId` diisi
  4. Auto-create satu `Bill` pertama: `id = bill-auto-{timestamp}`, `period` = bulan+tahun berjalan dalam Bahasa Indonesia (array nama bulan ID, sama seperti `MONTHS_ID` di Express), `dueDate` dari `settings.defaultDueDateDay` (fallback 5), `rentAmount` dari harga room (fallback `tenant.rentAmount`), `totalAmount = rentAmount`, `status = 'Belum Bayar'`
- `moveOut` (mirror `handleMoveOutTenant`): 404 `{error: 'Penghuni tidak ditemukan'}` kalau tenant tak ada. Kalau ada:
  1. Hapus semua `Bill` milik tenant dengan `status != 'Lunas'`
  2. Reset room yang match `tenantId` **atau** `number`/`id` == `roomAssigned` → `status = 'Kosong'`, `tenantId = null`
  3. Hapus tenant
- `destroy` — hapus tenant saja, tanpa efek samping (mirror Express)

## 7. Error Handling

Tidak ada layer validasi request (FormRequest) ditambahkan di fase ini — Express saat ini juga tidak validasi body sebelum insert, jadi parity perilaku dijaga apa adanya. Dua kasus 404 eksplisit (tenant/room tidak ditemukan) balas format sama seperti Express: `{error: 'pesan bahasa indonesia'}`. Exception tak terduga lainnya jatuh ke default JSON error handler Laravel (`APP_DEBUG=true` cukup untuk dev).

## 8. Verifikasi

**Tidak pakai** `RefreshDatabase`/`DatabaseMigrations` trait — akan migrate/truncate tabel di DB yang dipakai bersama aplikasi lain.

Sebagai gantinya: satu Feature test `tests/Feature/RoomsTenantsApiTest.php`, pola sama seperti `scripts/smoke-api.mjs` yang sudah ada untuk Express:
- ID row test diberi prefix `smoke-room-{time}` / `smoke-tenant-{time}`
- Assert lewat `postJson`/`getJson`: room CRUD; tenant POST → room flip ke `Terisi` + `tenantId` terisi; bill otomatis muncul di `kostos_bills` (dicek langsung via `Bill::find()`, karena belum ada endpoint publik) dengan `totalAmount`/`status` benar; `move-out` → tenant terhapus, room bebas lagi, bill belum-lunas ikut terhapus
- **Teardown eksplisit** di akhir test — hapus semua row `smoke-*` yang dibuat, sama seperti script Node

Dijalankan manual dengan `php artisan test` terhadap `.env` yang sama (remote DB) — bukan bagian dari CI, sama seperti smoke test Express sekarang.

## 9. Dev Workflow

- `backend/` sudah punya `vendor/` ter-install; perlu `php artisan key:generate` untuk isi `APP_KEY`
- Jalan standalone: `php artisan serve` (default port 8000), terpisah dari Vite (3000) dan Express (3001)
- Frontend **tidak diubah** di fase ini — proxy Vite tetap ke Express

## 10. Fase Lanjutan (di luar spec ini)

Setelah pola rooms+tenants terbukti jalan: tambah `BillController`, `ExpenseController`, `ComplaintController`, `SettingController` dengan pola yang sama, lalu baru pindahkan proxy Vite dari Express ke Laravel, lalu deprecate `server/`.
