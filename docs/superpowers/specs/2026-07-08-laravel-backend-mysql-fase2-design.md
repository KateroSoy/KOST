# Laravel Backend Fase 2 — Bills, Expenses, Complaints, Settings, Restore + Frontend Switch

> **Tanggal:** 2026-07-08
> **Branch:** `laravel-backend-mysql`
> **Status:** Disetujui, siap masuk fase perencanaan implementasi (writing-plans)
> **Mendahului:** `docs/superpowers/specs/2026-07-08-laravel-backend-mysql-design.md` (Fase 1 — rooms + tenants)

## 1. Latar Belakang

Fase 1 membangun fondasi Laravel + model/controller untuk `rooms` dan `tenants`, berdiri sendiri (frontend tetap di Express). Pemilik proyek memutuskan untuk mempercepat: selesaikan **semua entity** (bills, expenses, complaints, settings) plus endpoint `restore` sebelum mengalihkan frontend React dari Express ke Laravel — supaya tidak ada fitur yang rusak saat proxy dipindah.

## 2. Cakupan Fase 2

**Termasuk:**
- Model Eloquent baru: `Expense`, `Complaint` (pola sama seperti `Bill`/`Tenant` dari fase 1)
- `BillController` (index, store, payments, destroy) — mirror `server/routes/bills.js`
- `ExpenseController` (index, store, destroy) — mirror `server/routes/expenses.js`
- `ComplaintController` (index, store, update, destroy) — mirror `server/routes/complaints.js`
- `SettingController` (index, update) — mirror `server/routes/settings.js`, memakai `App\Models\Setting` yang sudah dibuat di Fase 1
- `RestoreController` (store — full wipe & replace) — mirror `server/routes/restore.js`, dengan protokol test khusus (lihat §6)
- Switch `vite.config.ts` proxy `/api` dari Express (`:3001`) ke Laravel (`:8000`) — **task terakhir**, hanya setelah semua test entity di atas hijau

**Tidak termasuk:**
- Auth/Sanctum
- Penghapusan `server/` (Express) — tetap ada untuk rollback
- Perubahan lain di `src/` selain `vite.config.ts`

## 3. Model Baru

| Model | Tabel | PK | Timestamps | Cast JSON |
|---|---|---|---|---|
| `Expense` | `kostos_expenses` | string | tidak | — |
| `Complaint` | `kostos_complaints` | string | tidak | — |

Field `Expense`: `id, category, description, date, amount, notes`.
Field `Complaint`: `id, tenantId, tenantName, roomId, roomNumber, title, category, status, priority, date, description, repairCost, notes`.

Konvensi identik Fase 1: `$incrementing = false; $keyType = 'string'; $timestamps = false;` dan migration idempoten (`Schema::hasTable()` guard) di tabel yang sudah ada.

## 4. Controllers & Business Rules

### BillController
- `index` — list urut `seq` desc (mirror Express: `ORDER BY seq DESC`)
- `store` — upsert bill, lalu:
  1. Set tenant (`tenantId`) → `status = 'Belum Bayar'`
  2. Set room yang **`number` == `bill.roomNumber`** (bukan match by id — beda dari `TenantController::store` yang match id-atau-number; ini **persis** perilaku `bills.js`) → `status = 'Terisi'`
- `payments` (`POST /api/bills/{id}/payments`) — mirror `handleRecordPayment`:
  1. 404 `{error: 'Tagihan tidak ditemukan'}` kalau bill tak ada
  2. `nextPaid = bill.paidAmount + amountPaid`
  3. `status = nextPaid >= totalAmount ? 'Lunas' : 'Sebagian'`
  4. Update `paymentMethod`, `paymentDate`, `notes` (fallback ke notes lama kalau tidak dikirim)
  5. Kalau `Lunas`: tenant → `Lunas`, room (by `roomNumber`) → `Terisi`
- `destroy` — hapus by id

### ExpenseController
CRUD polos, tanpa business rule tambahan: `index`, `store` (upsert), `destroy`.

### ComplaintController
- `index`, `store` (upsert) — polos
- `update` (`PATCH /api/complaints/{id}`) — 404 `{error: 'Komplain tidak ditemukan'}`; merge **hanya field yang dikirim** (field lain di body yang `null`/tidak ada tidak menimpa). **Tidak pernah** auto-create `Expense` meskipun `status=Selesai` dan `repairCost>0` — itu tanggung jawab client (mirror komentar eksplisit di `complaints.js`)
- `destroy` — hapus by id

### SettingController
- `index` (`GET /api/settings`) — baca row `id=1`; kalau belum ada, buat dari default (`INITIAL_SETTINGS` — nilai persis dari `server/seed-data.js`, sudah ada di DB jadi ini jalur fallback saja, bukan jalur utama)
- `update` (`PUT /api/settings`) — replace seluruh `data` dengan body request

### RestoreController
- `store` (`POST /api/restore`) — 400 `{error: 'kostSettings wajib ada'}` kalau `kostSettings` tidak dikirim. Dibungkus `DB::transaction()`:
  1. Hapus semua baris `kostos_bills` → `kostos_complaints` → `kostos_expenses` → `kostos_tenants` → `kostos_rooms` (urutan sama seperti `restore.js`)
  2. Tulis `kostSettings` ke `kostos_settings`
  3. Insert ulang `rooms`, `tenants`, `bills`, `expenses`, `complaints` dari array yang dikirim (default `[]` kalau tidak ada)
  4. Balas `{ok: true}`

## 5. Error Handling

Konsisten Fase 1: tanpa FormRequest validation, pesan 404 persis sama Bahasa Indonesia seperti Express (`'Tagihan tidak ditemukan'`, `'Komplain tidak ditemukan'`), 400 untuk restore tanpa `kostSettings`.

## 6. Verifikasi — Perhatian Khusus untuk Restore

Semua Feature test entity (Bill/Expense/Complaint/Setting) mengikuti pola Fase 1 persis: id `smoke-*`, teardown eksplisit, tanpa `RefreshDatabase`.

**RestoreController butuh protokol berbeda** karena satu-satunya endpoint yang menghapus **SELURUH** data — kalau dites naif terhadap DB bersama ini akan menghapus data asli kost pemilik (bukan cuma row smoke). Protokol wajib:

1. **Snapshot** seluruh data real di awal test: `Room::all()`, `Tenant::all()`, `Bill::all()`, `Expense::all()`, `Complaint::all()`, `Setting::find(1)->data`
2. Panggil `/api/restore` dengan payload berisi **satu baris `smoke-*` per entity** + `kostSettings` asli (tidak diubah)
3. Assert tabel sekarang cuma berisi baris smoke tsb
4. **Blok `try/finally`**: langkah "kembalikan snapshot lewat `/api/restore` lagi" ditaruh di `finally`, sehingga **selalu jalan** — termasuk kalau assertion di langkah 3 gagal — supaya data asli tidak pernah hilang permanen dari kegagalan test
5. Assert setelah restore-back: jumlah baris tiap tabel kembali sama seperti snapshot awal

Ini satu-satunya test di seluruh proyek yang menyentuh data non-`smoke-*` — didokumentasikan secara eksplisit di kode test kenapa itu aman (snapshot + guaranteed restore-back).

## 7. Switch Frontend (task terakhir fase ini)

`vite.config.ts`:
```diff
- proxy: { '/api': 'http://localhost:3001' },
+ proxy: { '/api': 'http://localhost:8000' },
```

Dijalankan **hanya** setelah seluruh test Bill/Expense/Complaint/Setting/Restore hijau. Setelah switch, verifikasi manual: jalankan `php artisan serve` (Laravel, port 8000) + `npm run dev` (Vite, port 3000), buka aplikasi di browser, coba alur inti (tambah kamar, tambah penghuni, catat pembayaran, tambah pengeluaran, update komplain, export/import backup) untuk memastikan tidak ada regresi sebelum dianggap selesai. `server/` (Express) tidak dihapus — tetap ada sebagai rollback (`vite.config.ts` tinggal dikembalikan ke `:3001`).

## 8. Fase Lanjutan (di luar spec ini)

Setelah frontend stabil di atas Laravel: pertimbangkan deprecate `server/` sepenuhnya, tambah auth kalau dibutuhkan, dan evaluasi apakah `server/` bisa dihapus dari repo.
