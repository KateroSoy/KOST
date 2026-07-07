# Panduan Deploy & Hosting Kostweb di cPanel

Aplikasi ini menggunakan React (Vite) untuk frontend dan backend Express yang menyimpan data ke **database MySQL remote** (dibuat di hPanel Hostinger). Ada **dua cara** untuk mengunggahnya:

- **METODE 1 (Hosting Statis)**: paling mudah, tetapi backend tidak ikut ter-deploy — aplikasi berjalan dalam mode offline/localStorage saja (data hanya tersimpan di browser masing-masing).
- **METODE 2 (Node.js App)**: **wajib dipakai jika ingin data tersimpan di MySQL** — backend dan frontend jalan bersama dalam satu aplikasi Node.js.

Sebelum METODE 2, selesaikan dulu bagian **Persiapan Database MySQL di hPanel** di bawah.

---

## METODE 1: Hosting Statis (Sangat Disarankan, Lebih Mudah)
Metode ini adalah cara paling umum untuk aplikasi React. Kita akan mengubah (build) kode menjadi file HTML, CSS, dan JS murni, lalu mengunggahnya ke folder `public_html`.

### Tahap 1: Build Aplikasi di Komputer Anda
1. Buka folder `kostweb` di VS Code.
2. Buka terminal VS Code (`Ctrl` + `\``).
3. Jalankan perintah ini untuk mem-build aplikasi:
   ```bash
   npm run build
   ```
4. Tunggu sampai proses selesai. Anda akan melihat folder baru bernama **`dist`** muncul di dalam folder proyek Anda.
5. Buka folder `dist` tersebut di File Explorer Windows Anda.
6. **Blok/pilih semua file dan folder** yang ada **di dalam** folder `dist` (termasuk `index.html`, folder `assets`, dll).
7. Klik kanan, lalu jadikan satu file **ZIP** (misalnya `upload.zip`).

### Tahap 2: Upload ke cPanel
1. Login ke akun cPanel Anda.
2. Cari dan buka menu **File Manager**.
3. Di sebelah kiri, klik folder **`public_html`** (atau folder domain/subdomain tujuan Anda).
4. Klik tombol **Upload** di menu bagian atas, lalu pilih file `upload.zip` yang tadi Anda buat.
5. Tunggu hingga bar upload menjadi hijau (100%), lalu klik "Go Back".
6. Di File Manager, klik kanan pada `upload.zip` lalu pilih **Extract**. Klik "Extract File".
7. (Opsional) Hapus file `upload.zip` untuk menghemat ruang.

### Tahap 3: Konfigurasi Routing (Sangat Penting)
Karena ini adalah aplikasi React (SPA), jika user me-refresh halaman selain halaman utama, cPanel akan menampilkan error 404. Kita perlu membuat file `.htaccess`.
1. Di dalam folder `public_html`, klik tombol **+ File** di pojok kiri atas.
2. Beri nama file: **`.htaccess`** (jangan lupa titik di depannya), lalu klik Create New File.
3. Klik kanan pada file `.htaccess` tersebut, lalu pilih **Edit**.
4. Masukkan kode berikut ke dalamnya:
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   ```
5. Klik **Save Changes** di pojok kanan atas.
6. Selesai! Buka domain Anda, aplikasi sudah berjalan.

---

## Persiapan Database MySQL di hPanel

1. Login ke hPanel Hostinger → menu **Databases → Management (MySQL Databases)**.
2. Buat database baru: isi nama database, username, dan password. Catat ketiganya.
3. Setelah dibuat, hPanel menampilkan **MySQL Host** (contoh: `srv1234.hstgr.io` — BUKAN `localhost` kalau backend jalan di komputer Anda). Catat hostname ini.
4. Kalau backend dijalankan dari luar Hostinger (misal dari komputer Windows Anda), buka menu **Databases → Remote MySQL**, lalu tambahkan IP publik Anda — atau isi `%` (izinkan semua host) kalau IP Anda sering berubah.
5. Di komputer Anda, salin `.env.example` menjadi `.env`, lalu isi:

   ```
   DB_HOST=srv1234.hstgr.io   (hostname dari langkah 3)
   DB_PORT=3306
   DB_USER=u123456_namauser
   DB_PASSWORD=passwordAnda
   DB_NAME=u123456_namadb
   ```

6. Tabel dibuat otomatis saat server pertama kali jalan — tidak perlu import SQL manual. Saat database masih kosong, server otomatis mengisinya dengan data contoh. Semua tabel aplikasi ini berawalan **`kostos_`** (misal `kostos_rooms`, `kostos_bills`), jadi aman meskipun database yang sama juga dipakai aplikasi lain (WordPress, dll).

> **Catatan untuk pemakaian lokal (Windows):** setelah `.env` terisi, aplikasi bisa langsung dipakai di komputer sendiri tanpa deploy — `npm run dev` untuk development, atau `npm run build` lalu `npm run start` (START.bat) untuk pemakaian sehari-hari. Semua data tersimpan di MySQL remote hPanel.

---

## METODE 2: Hosting Sebagai Node.js App (Wajib untuk Backend MySQL)
Gunakan metode ini jika hosting Anda mendukung "Setup Node.js App" dan Anda ingin data tersimpan di MySQL.

### Tahap 1: Persiapan File
1. Di komputer Anda, pastikan Anda sudah melakukan build (`npm run build`).
2. Buat file ZIP baru yang berisi file dan folder berikut dari dalam folder `kostweb`:
   - `dist` (seluruh folder)
   - `server` (seluruh folder — berisi kode API)
   - `server.js`
   - `package.json`
   - `package-lock.json`
   - `.env` (isi sesuai bagian Persiapan Database; **di hosting Hostinger, `DB_HOST` biasanya `localhost`** karena backend dan database berada di server yang sama)

### Tahap 2: Buat Node.js App di cPanel
1. Login ke cPanel, gulir ke bawah ke bagian **Software**, lalu klik **Setup Node.js App**.
2. Klik tombol **Create Application**.
3. Isi pengaturannya seperti ini:
   - **Node.js version**: Pilih versi terbaru yang tersedia (misal 20.x atau 18.x).
   - **Application mode**: Production.
   - **Application root**: Isi dengan `kostweb_app` (atau nama folder lain terserah Anda).
   - **Application URL**: Pilih domain/subdomain Anda.
   - **Application startup file**: Ketik `server.js`.
4. Klik tombol **CREATE** di pojok kanan atas.

### Tahap 3: Upload dan Install
1. Kembali ke Beranda cPanel, buka **File Manager**.
2. Buka folder root aplikasi yang tadi Anda buat (misal `kostweb_app`).
3. **Upload** file ZIP dari Tahap 1 ke dalam folder tersebut, lalu **Extract**.
4. Kembali ke halaman **Setup Node.js App** di cPanel.
5. Klik ikon pensil (Edit) pada aplikasi yang baru Anda buat.
6. Scroll ke bawah dan cari tombol **Run NPM Install**, lalu klik. (Tunggu beberapa menit hingga proses instalasi modul selesai).
7. Setelah selesai, klik tombol **RESTART** di bagian atas (di sebelah tulisan Stopped/Started).
8. Selesai! Buka domain Anda.
