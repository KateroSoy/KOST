# Panduan Deploy StayFlow SaaS ke Hostinger (Laravel + React)

## Arsitektur Produksi

StayFlow menggunakan **dua komponen**:
1. **React Frontend** (Vite build → `dist/`) — static files served oleh Laravel
2. **Laravel 11 Backend** (`backend/`) — dikonfigurasi sebagai PHP App di Hostinger

**Domain:** `https://blueviolet-gorilla-427889.hostingersite.com`

---

## LANGKAH 1: Update Kode (Setiap Kali Ada Perubahan)

Di komputer lokal Anda:

```bash
# 1. Build React frontend
npm run build

# 2. Salin hasil build ke public/ Laravel
xcopy /E /Y dist\* backend\public\
```

---

## LANGKAH 2: Upload ke Hostinger via Git / FTP

### Opsi A — Git Deploy (Direkomendasikan)
```bash
git add .
git commit -m "Production update: [deskripsi perubahan]"
git push
```

### Opsi B — Upload Manual (ZIP)
1. ZIP seluruh folder `backend/` 
2. Upload via hPanel → File Manager ke folder `public_html/`
3. Extract → rename ke `backend/` atau sesuai konfigurasi

---

## LANGKAH 3: Jalankan Migrasi Database (PENTING!)

> [!IMPORTANT]
> Setiap ada migration baru, WAJIB dijalankan via SSH atau Terminal hPanel.

### Via SSH / hPanel Terminal:
```bash
# Masuk ke folder Laravel
cd /home/u330327941/domains/blueviolet-gorilla-427889.hostingersite.com/public_html

# Jalankan semua pending migrations
php artisan migrate --force
```

### Migration Baru per Update:
| File | Tabel yang Dibuat |
|------|-------------------|
| `2026_08_11_000001_create_kostos_properties_table.php` | `kostos_properties` (wajib untuk fitur Multi-Properti!) |

---

## LANGKAH 4: Verifikasi Production Checklist

Setelah deploy, buka browser dan tes:

### ✅ Auth Flow
- [ ] Register akun baru → cek slug dibuat di DB (`kostos_users.slug`)
- [ ] Login → token tersimpan di localStorage
- [ ] Dashboard muncul dengan data dari API (bukan dummy)
- [ ] Logout → semua localStorage dihapus, redirect ke Landing

### ✅ Data Isolation (Multi-Tenant)
- [ ] Register 2 akun berbeda → data TIDAK bercampur
- [ ] Room owner A tidak muncul di dashboard owner B
- [ ] `GET /api/rooms` hanya returns rooms milik token yg aktif

### ✅ CRUD Operations
- [ ] Tambah kamar → kamar muncul di DB `kostos_rooms` dengan `user_id`
- [ ] Tambah penghuni → bill otomatis terbuat (1 bill, bukan duplikat)
- [ ] Catat pembayaran → status bill berubah ke Lunas
- [ ] Status penghuni berubah ke Lunas setelah bayar
- [ ] Hapus bill Lunas → harus **ditolak** (422 error — financial record protection)
- [ ] Tambah komplain → selesaikan → pengeluaran reparasi otomatis terbuat

### ✅ Multi-Properti
- [ ] Tambah properti → tersimpan di `kostos_properties` (bukan hanya localStorage)
- [ ] Login dari browser/device lain → properti masih ada

### ✅ Public Landing Page
- [ ] Akses `?owner={slug}` → tampil data kamar yang tersedia
- [ ] Data owner slug A tidak bocor ke owner slug B

### ✅ Demo Mode
- [ ] Klik "Coba Demo" → banner kuning muncul "Mode Demo Aktif"
- [ ] Klik "Daftar Gratis" di banner → redirect ke Register

---

## Konfigurasi .env Laravel (backend/.env)

```env
APP_NAME=StayFlow
APP_ENV=production
APP_KEY=base64:YIvxTpr5lTZ9V5GeePkKfI2kIfV5H8a8tbl3hWIb5C0=
APP_DEBUG=false
APP_URL=https://blueviolet-gorilla-427889.hostingersite.com

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=u330327941_nxSGS
DB_USERNAME=u330327941_UCCEN
DB_PASSWORD=Kostosxx1

SESSION_DRIVER=file
SESSION_LIFETIME=120
CACHE_STORE=file
QUEUE_CONNECTION=sync
```

---

## Perubahan di v2.0 (2026-08-11)

### Bug Fixes
- ✅ Middleware `ForceJsonResponse` sudah terdaftar — API error kini selalu JSON
- ✅ `TenantController::store()` tidak lagi membuat bill duplikat pada restore
- ✅ `RestoreController` kini idempotent — aman dijalankan berkali-kali
- ✅ `Expense` model `$fillable` sudah termasuk `seq` — ordering tidak error
- ✅ `authLogout` tidak lagi memanggil `clearToken()` dua kali
- ✅ Bill `Lunas` sekarang dilindungi dari penghapusan (HTTP 422)

### Fitur Baru
- ✅ `PUT /api/rooms/{id}` — full room edit via API
- ✅ `PUT /api/tenants/{id}` — full tenant edit via API
- ✅ `GET/POST/PUT/DELETE /api/properties` — multi-properti kini tersimpan ke MySQL
- ✅ Tabel `kostos_properties` baru di database
- ✅ Mode Demo menampilkan banner peringatan kuning
- ✅ Login/Register menampilkan spinner + button disabled selama loading

---

## Troubleshooting

### API Mengembalikan HTML (bukan JSON)
→ Pastikan `ForceJsonResponse` middleware ada di `bootstrap/app.php` ✅ (sudah diperbaiki)

### 401 Unauthorized setelah Login
→ Token expired. Clear cache browser → login ulang. Atau cek `SANCTUM_STATEFUL_DOMAINS` di .env.

### Kamar/Data tidak muncul setelah login ulang
→ Cek apakah `user_id` tersimpan di semua tabel. Jalankan: `SELECT * FROM kostos_rooms WHERE user_id IS NULL`

### Migration Gagal
→ Cek apakah tabel sudah ada: `SHOW TABLES LIKE 'kostos_%'`
→ Migration aman diulang — semua migration menggunakan `hasTable()` / `hasColumn()` guard.
