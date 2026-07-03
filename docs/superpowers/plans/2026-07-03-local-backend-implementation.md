# KOSTOS Local Backend & Database Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `localStorage` as the source of truth for every KOSTOS menu (Rooms, Tenants, Bills, Payments, Expenses, Complaints, Settings) with a real Express + SQLite backend, without changing the UI or the (client-side-flag) auth flow.

**Architecture:** An Express API under `/api/*`, backed by `better-sqlite3` at `./data/kostos.db`, runs on port 3001 in dev (proxied from Vite on 3000) and is mounted directly into `server.js` in prod. Cross-entity business rules (auto-bill on tenant add, room/tenant status flips, auto-expense on complaint resolution) move server-side into the route handlers, wrapped in `db.transaction()`. The frontend gets a thin `src/api.ts` fetch wrapper; `App.tsx` handlers become `async` and call it instead of mutating `localStorage`.

**Tech Stack:** Express 4 (existing dep), `better-sqlite3` (new dep, raw SQL, no ORM), `concurrently` (new devDependency, dev-only process runner), Vite dev proxy, React 19 / TypeScript (unchanged).

## Global Constraints

- The UI (all `src/components/*.tsx`) does not change — same props, same names, same behavior from the user's perspective.
- Auth stays a client-side `localStorage.getItem('kostos_logged_in')` flag — do not touch login/register/onboarding gating logic beyond swapping data calls.
- No ORM — raw SQL via `better-sqlite3` prepared statements, one small data-access module per resource under `server/db/`.
- Nested fields (`facilities[]`, `emergencyContact`, `bankAccounts[]`) are stored as JSON text columns and parsed/serialized in the data-access layer — `src/types.ts` does not change.
- `data/kostos.db` is gitignored; the DB is created and seeded once, on first boot, guarded by a file-existence check.
- No automated test framework is introduced. Verification is manual `curl` (or `node -e` fetch) against the running dev API server, per the spec's testing section.
- Money/currency fields (`price`, `rentAmount`, `amount`, etc.) are stored as SQLite `INTEGER` (Rupiah has no subunits in this app's data).
- Every route wraps its logic in try/catch and returns `{ error: message }` with a non-2xx status on failure; `src/api.ts` throws on any non-2xx response.

---

## File Structure

```
server/
  db/
    connection.js      # opens/creates the SQLite file, runs schema DDL, triggers seeding
    seed-data.js        # seedDatabase(db) — inserts the current src/data.ts sample data
    rooms.js             # rooms data-access module
    tenants.js            # tenants data-access module
    bills.js               # bills data-access module
    expenses.js             # expenses data-access module
    complaints.js            # complaints data-access module
    settings.js               # settings (singleton row) data-access module
  routes/
    rooms.js         # GET/POST /api/rooms, PATCH/DELETE /api/rooms/:id
    tenants.js         # GET/POST /api/tenants, DELETE /:id, POST /:id/move-out
    bills.js              # GET/POST /api/bills, DELETE /:id, POST /:id/payments
    expenses.js             # GET/POST /api/expenses, DELETE /:id
    complaints.js             # GET/POST /api/complaints, PATCH/DELETE /:id
    settings.js                 # GET/PUT /api/settings
    onboarding.js                 # POST /api/onboarding
    backup.js                       # GET /api/backup, POST /api/restore
  app.js            # createApiApp() — mounts every router onto one Express Router
  index.js            # dev-only entry: listens on port 3001
server.js            # MODIFIED: mounts createApiApp() at /api, still serves dist/
vite.config.ts        # MODIFIED: adds a /api dev proxy to port 3001
package.json           # MODIFIED: new deps + dev script via concurrently
.gitignore              # MODIFIED: adds data/
src/api.ts                # NEW: thin fetch wrapper, one function per current App.tsx handler
src/App.tsx                 # MODIFIED: async handlers calling src/api.ts instead of localStorage
```

Data flows one way per request: route handler → data-access module(s) (wrapped in `db.transaction()` when more than one table is touched) → JSON response shaped exactly like the object(s) the corresponding `App.tsx` handler already builds today, so the frontend rewrite is a mechanical "await the API, `setState` from the response" change.

---

### Task 1: Project wiring — dependencies, dev proxy, scripts, gitignore

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `npm run dev` starts Vite (3000) and the API dev server (3001, `server/index.js`, created in Task 11) together via `concurrently`; requests to `/api/*` from the Vite dev server are proxied to `http://localhost:3001`.

- [ ] **Step 1: Install the new dependencies**

Run: `npm install better-sqlite3@^12.11.1 concurrently@^10.0.3`
Expected: `package.json` gains `better-sqlite3` under `dependencies` and `concurrently` under `devDependencies` (or both under `dependencies` — either is fine, `concurrently` is only ever invoked via the `dev` script). No native-build errors; `better-sqlite3` ships a prebuilt binary for Node 22 / win32-x64.

- [ ] **Step 2: Verify the native binary loads**

Run: `node -e "const Database = require('better-sqlite3'); const db = new Database(':memory:'); db.exec('CREATE TABLE t (id TEXT)'); db.prepare('INSERT INTO t VALUES (?)').run('x'); console.log(db.prepare('SELECT * FROM t').all());"`
Expected: `[ { id: 'x' } ]`

- [ ] **Step 3: Update `package.json` scripts**

Replace the `"scripts"` block:

```json
  "scripts": {
    "dev": "concurrently -k -n vite,api -c blue,green \"vite --port=3000 --host=0.0.0.0\" \"node server/index.js\"",
    "dev:api": "node server/index.js",
    "build": "vite build",
    "preview": "vite preview",
    "start": "node server.js",
    "clean": "rm -rf dist server.js",
    "lint": "tsc --noEmit"
  },
```

- [ ] **Step 4: Add the `/api` dev proxy in `vite.config.ts`**

In `vite.config.ts`, extend the `server` block:

```ts
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api': 'http://localhost:3001',
      },
    },
```

- [ ] **Step 5: Gitignore the local database**

Add to `.gitignore` (after the existing `*.log` line):

```
data/
```

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vite.config.ts .gitignore
git commit -m "chore: add better-sqlite3/concurrently deps and API dev proxy"
```

---

### Task 2: SQLite bootstrap — schema and seed data

**Files:**
- Create: `server/db/connection.js`
- Create: `server/db/seed-data.js`

**Interfaces:**
- Consumes: nothing (this is the foundation module).
- Produces: `export const db` (a live `better-sqlite3` `Database` instance, WAL mode, with all 6 tables created) from `server/db/connection.js`. Every later `server/db/*.js` module does `import { db } from './connection.js'`. Tables: `settings`, `rooms`, `tenants`, `bills`, `expenses`, `complaints` (exact column names below — every later data-access module must match these).

- [ ] **Step 1: Write `server/db/seed-data.js`**

This mirrors the sample data in `src/data.ts` directly in JS (the server can't import a `.ts` file at runtime), so first boot looks identical to today's `localStorage` seed.

```js
export function seedDatabase(db) {
  db.prepare(`
    INSERT INTO settings (id, kost_name, address, owner_name, whatsapp, bank_accounts, default_due_date_day, reminder_template, auto_whatsapp_reminder, qris_merchant_id, enable_multi_kost)
    VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'Kost Mawar Indah',
    'Jl. Dago Asri No. 42, Coblong, Bandung, Jawa Barat 40135',
    'Ibu Indah Lestari',
    '081234567890',
    JSON.stringify([
      { id: 'bank-1', bankName: 'BCA', accountHolder: 'INDAH LESTARI', accountNumber: '2330998877' },
      { id: 'bank-2', bankName: 'Mandiri', accountHolder: 'INDAH LESTARI', accountNumber: '1310009988771' },
    ]),
    5,
    'Halo {nama}, ini pengingat pembayaran kost untuk kamar {kamar} periode {bulan}. Total tagihan: Rp {jumlah}. Mohon dibayarkan sebelum tanggal {tanggal}. Terima kasih - {nama_kost}.',
    0,
    'NMID-12003892718',
    0
  );

  const insertRoom = db.prepare(`
    INSERT INTO rooms (id, number, status, type, price, floor, size, facilities, tenant_id, notes, last_maintenance_date)
    VALUES (@id, @number, @status, @type, @price, @floor, @size, @facilities, @tenantId, @notes, @lastMaintenanceDate)
  `);
  const rooms = [
    { id: 'room-a01', number: 'A01', status: 'Terisi', type: 'Deluxe', price: 1500000, floor: 1, size: '3x4 m', facilities: ['AC', 'Kamar Mandi Dalam', 'Kasur Queen', 'WiFi', 'Lemari Baju'], tenantId: 'tenant-1', notes: 'Dekat dengan gerbang depan', lastMaintenanceDate: null },
    { id: 'room-a02', number: 'A02', status: 'Terisi', type: 'Deluxe', price: 1500000, floor: 1, size: '3x4 m', facilities: ['AC', 'Kamar Mandi Dalam', 'Kasur Queen', 'WiFi', 'Lemari Baju'], tenantId: 'tenant-2', notes: 'Tenang, jauh dari jalan raya', lastMaintenanceDate: null },
    { id: 'room-a03', number: 'A03', status: 'Kosong', type: 'Standard', price: 1200000, floor: 1, size: '3x3 m', facilities: ['Kipas Angin', 'Kamar Mandi Luar', 'Kasur Single', 'WiFi', 'Lemari Baju'], tenantId: null, notes: 'Baru saja dicat ulang', lastMaintenanceDate: null },
    { id: 'room-a04', number: 'A04', status: 'Menunggak', type: 'Suite', price: 2000000, floor: 1, size: '4x4 m', facilities: ['AC', 'Kamar Mandi Dalam', 'Water Heater', 'Kasur Queen', 'WiFi', 'TV'], tenantId: 'tenant-3', notes: null, lastMaintenanceDate: null },
    { id: 'room-b01', number: 'B01', status: 'Terisi', type: 'Standard', price: 1200000, floor: 2, size: '3x3 m', facilities: ['Kipas Angin', 'Kamar Mandi Luar', 'Kasur Single', 'WiFi', 'Lemari Baju'], tenantId: 'tenant-4', notes: null, lastMaintenanceDate: null },
    { id: 'room-b02', number: 'B02', status: 'Booking', type: 'Deluxe', price: 1500000, floor: 2, size: '3x4 m', facilities: ['AC', 'Kamar Mandi Dalam', 'Kasur Queen', 'WiFi', 'Lemari Baju'], tenantId: null, notes: 'Rencana masuk tanggal 10 Juni 2026', lastMaintenanceDate: null },
    { id: 'room-b03', number: 'B03', status: 'Perbaikan', type: 'Standard', price: 1200000, floor: 2, size: '3x3 m', facilities: ['Kipas Angin', 'Kamar Mandi Luar', 'Kasur Single', 'WiFi'], tenantId: null, notes: 'Perbaikan saluran air wastafel', lastMaintenanceDate: null },
    { id: 'room-b04', number: 'B04', status: 'Kosong', type: 'Suite', price: 1800000, floor: 2, size: '3.5x4 m', facilities: ['AC', 'Kamar Mandi Dalam', 'Kasur Queen', 'WiFi', 'Meja Kerja'], tenantId: null, notes: null, lastMaintenanceDate: null },
  ];
  for (const r of rooms) {
    insertRoom.run({ ...r, facilities: JSON.stringify(r.facilities) });
  }

  const insertTenant = db.prepare(`
    INSERT INTO tenants (id, name, phone, email, emergency_contact, id_number, room_assigned, move_in_date, rent_amount, deposit, status, notes, id_photo_url)
    VALUES (@id, @name, @phone, @email, @emergencyContact, @idNumber, @roomAssigned, @moveInDate, @rentAmount, @deposit, @status, @notes, @idPhotoUrl)
  `);
  const tenants = [
    { id: 'tenant-1', name: 'Andi Saputra', phone: '081298765432', email: 'andi.saputra@gmail.com', emergencyContact: { name: 'Bapak Maryono', relation: 'Ayah Kandung', phone: '081211112222' }, idNumber: '3273111204950001', roomAssigned: 'A01', moveInDate: '2025-01-15', rentAmount: 1500000, deposit: 1500000, status: 'Lunas', notes: 'Mahasiswa ITB angkatan 2023, ramah dan rajin bersih-bersih', idPhotoUrl: null },
    { id: 'tenant-2', name: 'Rina Lestari', phone: '085733334444', email: 'rina.lestari@office.com', emergencyContact: { name: 'Ibu Hartati', relation: 'Ibu Kandung', phone: '085755556666' }, idNumber: '3273094803930002', roomAssigned: 'A02', moveInDate: '2024-11-01', rentAmount: 1500000, deposit: 1500000, status: 'Lunas', notes: 'Karyawati bank swasta di Dago, pendiam', idPhotoUrl: null },
    { id: 'tenant-3', name: 'Budi Santoso', phone: '089912345678', email: 'budi.santos@gmail.com', emergencyContact: { name: 'Setyawan', relation: 'Kakak', phone: '089922223333' }, idNumber: '3204983204920005', roomAssigned: 'A04', moveInDate: '2025-03-20', rentAmount: 2000000, deposit: 2000000, status: 'Terlambat', notes: 'Bekerja di startup bidang logistik, sering telat bayar 3-5 hari', idPhotoUrl: null },
    { id: 'tenant-4', name: 'Sari Wulandari', phone: '082199887766', email: 'sari.wulan@student.com', emergencyContact: { name: 'Bapak Joko', relation: 'Paman', phone: '082177665544' }, idNumber: '3273082910970003', roomAssigned: 'B01', moveInDate: '2025-05-01', rentAmount: 1200000, deposit: 1000000, status: 'Belum Bayar', notes: null, idPhotoUrl: null },
  ];
  for (const t of tenants) {
    insertTenant.run({ ...t, emergencyContact: JSON.stringify(t.emergencyContact) });
  }

  const insertBill = db.prepare(`
    INSERT INTO bills (id, tenant_id, tenant_name, room_id, room_number, period, due_date, rent_amount, electricity_charge, water_charge, additional_fee, discount, late_fee, total_amount, paid_amount, status, payment_method, payment_date, notes)
    VALUES (@id, @tenantId, @tenantName, @roomId, @roomNumber, @period, @dueDate, @rentAmount, @electricityCharge, @waterCharge, @additionalFee, @discount, @lateFee, @totalAmount, @paidAmount, @status, @paymentMethod, @paymentDate, @notes)
  `);
  const bills = [
    { id: 'bill-101', tenantId: 'tenant-1', tenantName: 'Andi Saputra', roomId: 'room-a01', roomNumber: 'A01', period: 'Juni 2026', dueDate: '2026-06-05', rentAmount: 1500000, electricityCharge: 150000, waterCharge: 50000, additionalFee: 0, discount: 0, lateFee: 0, totalAmount: 1700000, paidAmount: 1700000, status: 'Lunas', paymentMethod: 'Transfer Bank', paymentDate: '2026-06-01', notes: 'Sudah bayar tgl 1 pagi hari' },
    { id: 'bill-102', tenantId: 'tenant-2', tenantName: 'Rina Lestari', roomId: 'room-a02', roomNumber: 'A02', period: 'Juni 2026', dueDate: '2026-06-05', rentAmount: 1500000, electricityCharge: 120000, waterCharge: 50000, additionalFee: 0, discount: 50000, lateFee: 0, totalAmount: 1620000, paidAmount: 1620000, status: 'Lunas', paymentMethod: 'Transfer Bank', paymentDate: '2026-05-31', notes: 'Diskon tenant setia, bayar lebih awal' },
    { id: 'bill-103', tenantId: 'tenant-4', tenantName: 'Sari Wulandari', roomId: 'room-b01', roomNumber: 'B01', period: 'Juni 2026', dueDate: '2026-06-05', rentAmount: 1200000, electricityCharge: 80000, waterCharge: 50000, additionalFee: 0, discount: 0, lateFee: 0, totalAmount: 1330000, paidAmount: 0, status: 'Belum Bayar', paymentMethod: null, paymentDate: null, notes: 'Gaji bulanan baru turun tanggal 5' },
    { id: 'bill-104', tenantId: 'tenant-3', tenantName: 'Budi Santoso', roomId: 'room-a04', roomNumber: 'A04', period: 'Mei 2026', dueDate: '2026-05-05', rentAmount: 2000000, electricityCharge: 220000, waterCharge: 50000, additionalFee: 30000, discount: 0, lateFee: 50000, totalAmount: 2350000, paidAmount: 1000000, status: 'Belum Bayar', paymentMethod: null, paymentDate: null, notes: 'Tunggakan Mei, sisa Rp 1.350.000 belum lunas. Janji dilunasi di tanggal 5 Juni.' },
  ];
  for (const b of bills) {
    insertBill.run(b);
  }

  const insertExpense = db.prepare(`
    INSERT INTO expenses (id, category, description, date, amount, notes)
    VALUES (@id, @category, @description, @date, @amount, @notes)
  `);
  const expenses = [
    { id: 'exp-1', category: 'Listrik', description: 'Bayar Listrik Token Induk Kost', date: '2026-05-25', amount: 1200000, notes: 'Token 1.200.000 untuk sisa 2 bulan' },
    { id: 'exp-2', category: 'Air', description: 'Iuran Bulanan PDAM Kost', date: '2026-05-20', amount: 350000, notes: 'Tagihan normal, air bersih lancar' },
    { id: 'exp-3', category: 'Internet', description: 'Internet Biznet 100 Mbps', date: '2026-05-18', amount: 450000, notes: 'Biaya langganan bulanan' },
    { id: 'exp-4', category: 'Kebersihan', description: 'Beli Alat & Sabun Pel, Pengharum Ruangan', date: '2026-05-12', amount: 150000, notes: null },
    { id: 'exp-5', category: 'Perbaikan', description: 'Service AC Kamar A01 dan A02', date: '2026-05-10', amount: 350000, notes: 'Tambah freon dan cuci rutin' },
  ];
  for (const e of expenses) {
    insertExpense.run(e);
  }

  const insertComplaint = db.prepare(`
    INSERT INTO complaints (id, tenant_id, tenant_name, room_id, room_number, title, category, status, priority, date, description, repair_cost, notes)
    VALUES (@id, @tenantId, @tenantName, @roomId, @roomNumber, @title, @category, @status, @priority, @date, @description, @repairCost, @notes)
  `);
  const complaints = [
    { id: 'comp-1', tenantId: 'tenant-1', tenantName: 'Andi Saputra', roomId: 'room-a01', roomNumber: 'A01', title: 'Air Washtafel Bocor', category: 'Air', status: 'Diproses', priority: 'Sedang', date: '2026-05-30', description: 'Saluran pembuangan air di wastafel kamar bocor, jadi membasahi lantai keramik. Mohon segera dicek karena becek.', repairCost: null, notes: 'Sudah hubungi tukang langganan, dijadwalkan datang besok sore.' },
    { id: 'comp-2', tenantId: 'tenant-3', tenantName: 'Budi Santoso', roomId: 'room-a04', roomNumber: 'A04', title: 'AC Kamar Bocor Air', category: 'AC/Kipas', status: 'Selesai', priority: 'Tinggi', date: '2026-05-15', description: 'AC meneteskan air deras sekali di atas tempat tidur saya. Tidak bisa tidur malam.', repairCost: 150000, notes: 'Telah dibersihkan filternya dan diservice oleh teknisi AC tgl 16 Mei. Biaya Rp150.000.' },
    { id: 'comp-3', tenantId: 'tenant-4', tenantName: 'Sari Wulandari', roomId: 'room-b01', roomNumber: 'B01', title: 'WiFi Lambat Sekali Malam Hari', category: 'Internet', status: 'Baru', priority: 'Rendah', date: '2026-05-31', description: 'Sinyal WiFi penuh tapi koneksinya lemot sekali dari jam 8 sampai 11 malam, mohon dibantu restart router lantai 2.', repairCost: null, notes: 'Perlu cek apakah ada pembatasan bandwidth atau ada pemakaian berlebih.' },
  ];
  for (const c of complaints) {
    insertComplaint.run(c);
  }
}
```

- [ ] **Step 2: Write `server/db/connection.js`**

```js
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { seedDatabase } from './seed-data.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '..', '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'kostos.db');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const isNewDatabase = !fs.existsSync(DB_PATH);

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    kost_name TEXT NOT NULL,
    address TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    bank_accounts TEXT NOT NULL,
    default_due_date_day INTEGER NOT NULL,
    reminder_template TEXT NOT NULL,
    auto_whatsapp_reminder INTEGER NOT NULL,
    qris_merchant_id TEXT,
    enable_multi_kost INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    number TEXT NOT NULL,
    status TEXT NOT NULL,
    type TEXT NOT NULL,
    price INTEGER NOT NULL,
    floor INTEGER NOT NULL,
    size TEXT NOT NULL,
    facilities TEXT NOT NULL,
    tenant_id TEXT,
    notes TEXT,
    last_maintenance_date TEXT
  );

  CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    emergency_contact TEXT NOT NULL,
    id_number TEXT,
    room_assigned TEXT NOT NULL,
    move_in_date TEXT NOT NULL,
    rent_amount INTEGER NOT NULL,
    deposit INTEGER NOT NULL,
    status TEXT NOT NULL,
    notes TEXT,
    id_photo_url TEXT
  );

  CREATE TABLE IF NOT EXISTS bills (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    tenant_name TEXT NOT NULL,
    room_id TEXT NOT NULL,
    room_number TEXT NOT NULL,
    period TEXT NOT NULL,
    due_date TEXT NOT NULL,
    rent_amount INTEGER NOT NULL,
    electricity_charge INTEGER NOT NULL,
    water_charge INTEGER NOT NULL,
    additional_fee INTEGER NOT NULL,
    discount INTEGER NOT NULL,
    late_fee INTEGER NOT NULL,
    total_amount INTEGER NOT NULL,
    paid_amount INTEGER NOT NULL,
    status TEXT NOT NULL,
    payment_method TEXT,
    payment_date TEXT,
    notes TEXT
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    date TEXT NOT NULL,
    amount INTEGER NOT NULL,
    notes TEXT
  );

  CREATE TABLE IF NOT EXISTS complaints (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    tenant_name TEXT NOT NULL,
    room_id TEXT NOT NULL,
    room_number TEXT NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT NOT NULL,
    priority TEXT NOT NULL,
    date TEXT NOT NULL,
    description TEXT NOT NULL,
    repair_cost INTEGER,
    notes TEXT
  );
`);

if (isNewDatabase) {
  seedDatabase(db);
}
```

- [ ] **Step 3: Verify schema creation and seeding**

Run: `node -e "import('./server/db/connection.js').then(({db}) => { console.log(db.prepare('SELECT count(*) c FROM rooms').get()); console.log(db.prepare('SELECT count(*) c FROM tenants').get()); console.log(db.prepare('SELECT * FROM settings').get().kost_name); })"`
Expected: `{ c: 8 }`, `{ c: 4 }`, `Kost Mawar Indah`. This also creates `data/kostos.db` on disk — confirm with `ls data/`.

- [ ] **Step 4: Commit**

```bash
git add server/db/connection.js server/db/seed-data.js
git commit -m "feat: bootstrap SQLite schema and first-boot seed data"
```

---

### Task 3: Rooms resource — data access + routes

**Files:**
- Create: `server/db/rooms.js`
- Create: `server/routes/rooms.js`
- Test: manual `curl` against a temporary standalone server (Step 4 below)

**Interfaces:**
- Consumes: `db` from `server/db/connection.js` (Task 2).
- Produces (for later tasks): from `server/db/rooms.js` — `listRooms()`, `getRoomById(id)`, `insertRoom(room)`, `updateRoomStatus(id, status, tenantId)`, `updateRoomByNumber(number, { status, tenantId })`, `deleteRoom(id)`, `deleteAllRooms()`. All return camelCase `Room`-shaped objects (or `null` if not found) matching `src/types.ts`. From `server/routes/rooms.js` — `roomsRouter` (an Express `Router`).

- [ ] **Step 1: Write `server/db/rooms.js`**

```js
import { db } from './connection.js';

function rowToRoom(row) {
  if (!row) return null;
  return {
    id: row.id,
    number: row.number,
    status: row.status,
    type: row.type,
    price: row.price,
    floor: row.floor,
    size: row.size,
    facilities: JSON.parse(row.facilities),
    tenantId: row.tenant_id || undefined,
    notes: row.notes || undefined,
    lastMaintenanceDate: row.last_maintenance_date || undefined,
  };
}

export function listRooms() {
  return db.prepare('SELECT * FROM rooms ORDER BY number').all().map(rowToRoom);
}

export function getRoomById(id) {
  return rowToRoom(db.prepare('SELECT * FROM rooms WHERE id = ?').get(id));
}

export function insertRoom(room) {
  db.prepare(`
    INSERT INTO rooms (id, number, status, type, price, floor, size, facilities, tenant_id, notes, last_maintenance_date)
    VALUES (@id, @number, @status, @type, @price, @floor, @size, @facilities, @tenantId, @notes, @lastMaintenanceDate)
  `).run({
    id: room.id,
    number: room.number,
    status: room.status,
    type: room.type,
    price: room.price,
    floor: room.floor,
    size: room.size,
    facilities: JSON.stringify(room.facilities || []),
    tenantId: room.tenantId || null,
    notes: room.notes || null,
    lastMaintenanceDate: room.lastMaintenanceDate || null,
  });
  return getRoomById(room.id);
}

export function updateRoomStatus(id, status, tenantId) {
  const current = getRoomById(id);
  if (!current) return null;
  db.prepare('UPDATE rooms SET status = ?, tenant_id = ? WHERE id = ?').run(
    status,
    tenantId !== undefined ? tenantId : current.tenantId || null,
    id
  );
  return getRoomById(id);
}

export function updateRoomByNumber(number, fields) {
  const row = db.prepare('SELECT * FROM rooms WHERE number = ?').get(number);
  if (!row) return null;
  db.prepare('UPDATE rooms SET status = ?, tenant_id = ? WHERE number = ?').run(
    fields.status !== undefined ? fields.status : row.status,
    fields.tenantId !== undefined ? fields.tenantId : row.tenant_id,
    number
  );
  return getRoomById(row.id);
}

export function deleteRoom(id) {
  db.prepare('DELETE FROM rooms WHERE id = ?').run(id);
}

export function deleteAllRooms() {
  db.prepare('DELETE FROM rooms').run();
}
```

- [ ] **Step 2: Write `server/routes/rooms.js`**

```js
import { Router } from 'express';
import { listRooms, insertRoom, updateRoomStatus, deleteRoom } from '../db/rooms.js';

export const roomsRouter = Router();

roomsRouter.get('/', (req, res) => {
  res.json(listRooms());
});

roomsRouter.post('/', (req, res) => {
  try {
    res.status(201).json(insertRoom(req.body));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

roomsRouter.patch('/:id', (req, res) => {
  try {
    const updated = updateRoomStatus(req.params.id, req.body.status, req.body.tenantId);
    if (!updated) return res.status(404).json({ error: 'Kamar tidak ditemukan' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

roomsRouter.delete('/:id', (req, res) => {
  deleteRoom(req.params.id);
  res.status(204).end();
});
```

- [ ] **Step 3: Wire a temporary smoke-test server**

Create a scratch file `server/_smoke.js` (deleted in Step 5, not committed):

```js
import express from 'express';
import { roomsRouter } from './routes/rooms.js';

const app = express();
app.use(express.json());
app.use('/api/rooms', roomsRouter);
app.listen(3999, () => console.log('smoke server on 3999'));
```

- [ ] **Step 4: Run it and verify with curl**

Run: `node server/_smoke.js &` then, after it prints `smoke server on 3999`:

```bash
curl -s http://localhost:3999/api/rooms | head -c 300
curl -s -X POST http://localhost:3999/api/rooms -H "Content-Type: application/json" -d '{"id":"room-test","number":"Z99","status":"Kosong","type":"Standard","price":1000000,"floor":9,"size":"3x3 m","facilities":["WiFi"]}'
curl -s -X PATCH http://localhost:3999/api/rooms/room-test -H "Content-Type: application/json" -d '{"status":"Perbaikan"}'
curl -s -X DELETE -o /dev/null -w "%{http_code}\n" http://localhost:3999/api/rooms/room-test
```

Expected: GET returns the 8 seeded rooms; POST returns the created room with `"status":"Kosong"`; PATCH returns it with `"status":"Perbaikan"`; DELETE returns `204`. Then stop the smoke server: `kill %1`.

- [ ] **Step 5: Remove the scratch file**

```bash
rm server/_smoke.js
```

- [ ] **Step 6: Commit**

```bash
git add server/db/rooms.js server/routes/rooms.js
git commit -m "feat: add rooms data-access module and REST routes"
```

---

### Task 4: Settings resource — data access + routes

**Files:**
- Create: `server/db/settings.js`
- Create: `server/routes/settings.js`

**Interfaces:**
- Consumes: `db` from `server/db/connection.js`.
- Produces: `getSettings()`, `updateSettings(settings)` from `server/db/settings.js` (both return a camelCase `KostSettings` object). `settingsRouter` from `server/routes/settings.js`. Task 5 (tenants) consumes `getSettings()` for `defaultDueDateDay`.

- [ ] **Step 1: Write `server/db/settings.js`**

```js
import { db } from './connection.js';

function rowToSettings(row) {
  return {
    kostName: row.kost_name,
    address: row.address,
    ownerName: row.owner_name,
    whatsapp: row.whatsapp,
    bankAccounts: JSON.parse(row.bank_accounts),
    defaultDueDateDay: row.default_due_date_day,
    reminderTemplate: row.reminder_template,
    autoWhatsAppReminder: !!row.auto_whatsapp_reminder,
    qrisMerchantId: row.qris_merchant_id || undefined,
    enableMultiKost: !!row.enable_multi_kost,
  };
}

export function getSettings() {
  return rowToSettings(db.prepare('SELECT * FROM settings WHERE id = 1').get());
}

export function updateSettings(settings) {
  db.prepare(`
    INSERT INTO settings (id, kost_name, address, owner_name, whatsapp, bank_accounts, default_due_date_day, reminder_template, auto_whatsapp_reminder, qris_merchant_id, enable_multi_kost)
    VALUES (1, @kostName, @address, @ownerName, @whatsapp, @bankAccounts, @defaultDueDateDay, @reminderTemplate, @autoWhatsAppReminder, @qrisMerchantId, @enableMultiKost)
    ON CONFLICT(id) DO UPDATE SET
      kost_name = excluded.kost_name,
      address = excluded.address,
      owner_name = excluded.owner_name,
      whatsapp = excluded.whatsapp,
      bank_accounts = excluded.bank_accounts,
      default_due_date_day = excluded.default_due_date_day,
      reminder_template = excluded.reminder_template,
      auto_whatsapp_reminder = excluded.auto_whatsapp_reminder,
      qris_merchant_id = excluded.qris_merchant_id,
      enable_multi_kost = excluded.enable_multi_kost
  `).run({
    kostName: settings.kostName,
    address: settings.address,
    ownerName: settings.ownerName,
    whatsapp: settings.whatsapp,
    bankAccounts: JSON.stringify(settings.bankAccounts || []),
    defaultDueDateDay: settings.defaultDueDateDay,
    reminderTemplate: settings.reminderTemplate,
    autoWhatsAppReminder: settings.autoWhatsAppReminder ? 1 : 0,
    qrisMerchantId: settings.qrisMerchantId || null,
    enableMultiKost: settings.enableMultiKost ? 1 : 0,
  });
  return getSettings();
}
```

- [ ] **Step 2: Write `server/routes/settings.js`**

```js
import { Router } from 'express';
import { getSettings, updateSettings } from '../db/settings.js';

export const settingsRouter = Router();

settingsRouter.get('/', (req, res) => {
  res.json(getSettings());
});

settingsRouter.put('/', (req, res) => {
  try {
    res.json(updateSettings(req.body));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
```

- [ ] **Step 3: Smoke-test**

Repeat the Task 3 Step 3–5 pattern: temporary `server/_smoke.js` mounting `settingsRouter` at `/api/settings` on port 3999.

```bash
curl -s http://localhost:3999/api/settings | head -c 200
curl -s -X PUT http://localhost:3999/api/settings -H "Content-Type: application/json" -d '{"kostName":"Kost Test","address":"Jl. Test","ownerName":"Owner","whatsapp":"0812","bankAccounts":[],"defaultDueDateDay":10,"reminderTemplate":"x","autoWhatsAppReminder":false,"enableMultiKost":false}'
```

Expected: GET returns the seeded settings with `"kostName":"Kost Mawar Indah"`; PUT returns `"kostName":"Kost Test","defaultDueDateDay":10`. Then re-run PUT with the original seeded values (or just leave it — Task 11's full smoke test will re-seed a fresh temp DB) and `rm server/_smoke.js`.

- [ ] **Step 4: Commit**

```bash
git add server/db/settings.js server/routes/settings.js
git commit -m "feat: add settings data-access module and REST routes"
```

---

### Task 5: Tenants resource — data access + routes (auto-bill + move-out business rules)

**Files:**
- Create: `server/db/tenants.js`
- Create: `server/routes/tenants.js`

**Interfaces:**
- Consumes: `db` from `server/db/connection.js`; `getRoomById`, `updateRoomStatus`, `updateRoomByNumber` from `server/db/rooms.js` (Task 3); `getSettings` from `server/db/settings.js` (Task 4); `insertBill`, `deleteUnpaidBillsForTenant` from `server/db/bills.js` (**created in this task** — see Step 1a — since tenants needs to create the tenant's first bill).
- Produces: `listTenants()`, `getTenantById(id)`, `insertTenant(tenant)`, `updateTenantStatus(id, status)`, `deleteTenant(id)`, `deleteAllTenants()` from `server/db/tenants.js`. `tenantsRouter` from `server/routes/tenants.js`.

> Note: `server/db/bills.js` is the full deliverable of Task 6, but tenant creation needs `insertBill` and `deleteUnpaidBillsForTenant` *now*. To avoid a forward reference, this task creates a minimal `server/db/bills.js` with just those two functions; Task 6 extends the same file with the rest (`listBills`, `getBillById`, `recordBillPayment`, `deleteBill`, `deleteAllBills`) — no function created here is renamed or removed later.

- [ ] **Step 1: Write `server/db/tenants.js`**

```js
import { db } from './connection.js';

function rowToTenant(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email || '',
    emergencyContact: JSON.parse(row.emergency_contact),
    idNumber: row.id_number || '',
    roomAssigned: row.room_assigned,
    moveInDate: row.move_in_date,
    rentAmount: row.rent_amount,
    deposit: row.deposit,
    status: row.status,
    notes: row.notes || undefined,
    idPhotoUrl: row.id_photo_url || undefined,
  };
}

export function listTenants() {
  return db.prepare('SELECT * FROM tenants ORDER BY move_in_date DESC').all().map(rowToTenant);
}

export function getTenantById(id) {
  return rowToTenant(db.prepare('SELECT * FROM tenants WHERE id = ?').get(id));
}

export function insertTenant(tenant) {
  db.prepare(`
    INSERT INTO tenants (id, name, phone, email, emergency_contact, id_number, room_assigned, move_in_date, rent_amount, deposit, status, notes, id_photo_url)
    VALUES (@id, @name, @phone, @email, @emergencyContact, @idNumber, @roomAssigned, @moveInDate, @rentAmount, @deposit, @status, @notes, @idPhotoUrl)
  `).run({
    id: tenant.id,
    name: tenant.name,
    phone: tenant.phone,
    email: tenant.email || null,
    emergencyContact: JSON.stringify(tenant.emergencyContact || {}),
    idNumber: tenant.idNumber || null,
    roomAssigned: tenant.roomAssigned,
    moveInDate: tenant.moveInDate,
    rentAmount: tenant.rentAmount,
    deposit: tenant.deposit,
    status: tenant.status,
    notes: tenant.notes || null,
    idPhotoUrl: tenant.idPhotoUrl || null,
  });
  return getTenantById(tenant.id);
}

export function updateTenantStatus(id, status) {
  db.prepare('UPDATE tenants SET status = ? WHERE id = ?').run(status, id);
  return getTenantById(id);
}

export function deleteTenant(id) {
  db.prepare('DELETE FROM tenants WHERE id = ?').run(id);
}

export function deleteAllTenants() {
  db.prepare('DELETE FROM tenants').run();
}
```

- [ ] **Step 1a: Write the minimal `server/db/bills.js` needed for tenant creation**

```js
import { db } from './connection.js';

function rowToBill(row) {
  if (!row) return null;
  return {
    id: row.id,
    tenantId: row.tenant_id,
    tenantName: row.tenant_name,
    roomId: row.room_id,
    roomNumber: row.room_number,
    period: row.period,
    dueDate: row.due_date,
    rentAmount: row.rent_amount,
    electricityCharge: row.electricity_charge,
    waterCharge: row.water_charge,
    additionalFee: row.additional_fee,
    discount: row.discount,
    lateFee: row.late_fee,
    totalAmount: row.total_amount,
    paidAmount: row.paid_amount,
    status: row.status,
    paymentMethod: row.payment_method || undefined,
    paymentDate: row.payment_date || undefined,
    notes: row.notes || undefined,
  };
}

export function getBillById(id) {
  return rowToBill(db.prepare('SELECT * FROM bills WHERE id = ?').get(id));
}

export function insertBill(bill) {
  db.prepare(`
    INSERT INTO bills (id, tenant_id, tenant_name, room_id, room_number, period, due_date, rent_amount, electricity_charge, water_charge, additional_fee, discount, late_fee, total_amount, paid_amount, status, payment_method, payment_date, notes)
    VALUES (@id, @tenantId, @tenantName, @roomId, @roomNumber, @period, @dueDate, @rentAmount, @electricityCharge, @waterCharge, @additionalFee, @discount, @lateFee, @totalAmount, @paidAmount, @status, @paymentMethod, @paymentDate, @notes)
  `).run({
    id: bill.id,
    tenantId: bill.tenantId,
    tenantName: bill.tenantName,
    roomId: bill.roomId,
    roomNumber: bill.roomNumber,
    period: bill.period,
    dueDate: bill.dueDate,
    rentAmount: bill.rentAmount,
    electricityCharge: bill.electricityCharge,
    waterCharge: bill.waterCharge,
    additionalFee: bill.additionalFee,
    discount: bill.discount,
    lateFee: bill.lateFee,
    totalAmount: bill.totalAmount,
    paidAmount: bill.paidAmount,
    status: bill.status,
    paymentMethod: bill.paymentMethod || null,
    paymentDate: bill.paymentDate || null,
    notes: bill.notes || null,
  });
  return getBillById(bill.id);
}

export function deleteUnpaidBillsForTenant(tenantId) {
  const ids = db.prepare("SELECT id FROM bills WHERE tenant_id = ? AND status != 'Lunas'").all(tenantId).map(r => r.id);
  db.prepare("DELETE FROM bills WHERE tenant_id = ? AND status != 'Lunas'").run(tenantId);
  return ids;
}
```

- [ ] **Step 2: Write `server/routes/tenants.js`**

```js
import { Router } from 'express';
import { db } from '../db/connection.js';
import { listTenants, insertTenant, deleteTenant } from '../db/tenants.js';
import { getRoomById, updateRoomStatus, updateRoomByNumber } from '../db/rooms.js';
import { getSettings } from '../db/settings.js';
import { insertBill, deleteUnpaidBillsForTenant } from '../db/bills.js';

const MONTHS = {
  Januari: '01', Februari: '02', Maret: '03', April: '04',
  Mei: '05', Juni: '06', Juli: '07', Agustus: '08',
  September: '09', Oktober: '10', November: '11', Desember: '12',
};

function computeDueDate(period, defaultDueDateDay) {
  const parts = String(period).split(' ');
  const monthNum = MONTHS[parts[0]] || '06';
  const year = parts[1] || String(new Date().getFullYear());
  const day = String(defaultDueDateDay || 5).padStart(2, '0');
  return `${year}-${monthNum}-${day}`;
}

export const tenantsRouter = Router();

tenantsRouter.get('/', (req, res) => {
  res.json(listTenants());
});

tenantsRouter.post('/', (req, res) => {
  const { tenant, assignedRoomId, period } = req.body;
  try {
    const result = db.transaction(() => {
      const room = getRoomById(assignedRoomId);
      if (!room) throw new Error('Kamar tidak ditemukan');

      const createdTenant = insertTenant(tenant);
      const updatedRoom = updateRoomStatus(assignedRoomId, 'Terisi', createdTenant.id);
      const settings = getSettings();

      const bill = insertBill({
        id: `bill-auto-${Date.now()}`,
        tenantId: createdTenant.id,
        tenantName: createdTenant.name,
        roomId: assignedRoomId,
        roomNumber: updatedRoom.number,
        period,
        dueDate: computeDueDate(period, settings.defaultDueDateDay),
        rentAmount: room.price,
        electricityCharge: 0,
        waterCharge: 0,
        additionalFee: 0,
        discount: 0,
        lateFee: 0,
        totalAmount: room.price,
        paidAmount: 0,
        status: 'Belum Bayar',
      });

      return { tenant: createdTenant, room: updatedRoom, bill };
    })();

    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

tenantsRouter.post('/:id/move-out', (req, res) => {
  const { roomNumber } = req.body;
  try {
    const result = db.transaction(() => {
      const deletedBillIds = deleteUnpaidBillsForTenant(req.params.id);
      const room = updateRoomByNumber(roomNumber, { status: 'Kosong', tenantId: null });
      deleteTenant(req.params.id);
      return { room, deletedBillIds };
    })();
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

tenantsRouter.delete('/:id', (req, res) => {
  deleteTenant(req.params.id);
  res.status(204).end();
});
```

- [ ] **Step 3: Smoke-test the auto-bill and move-out rules**

Temporary `server/_smoke.js`:

```js
import express from 'express';
import { roomsRouter } from './routes/rooms.js';
import { tenantsRouter } from './routes/tenants.js';

const app = express();
app.use(express.json());
app.use('/api/rooms', roomsRouter);
app.use('/api/tenants', tenantsRouter);
app.listen(3999, () => console.log('smoke server on 3999'));
```

```bash
node server/_smoke.js &
curl -s -X POST http://localhost:3999/api/tenants -H "Content-Type: application/json" -d '{
  "tenant": {"id":"tenant-test","name":"Test Orang","phone":"0812000","email":"t@test.com","emergencyContact":{"name":"X","relation":"Y","phone":"0813"},"idNumber":"123","roomAssigned":"A03","moveInDate":"2026-07-01","rentAmount":1200000,"deposit":1000000,"status":"Belum Bayar"},
  "assignedRoomId": "room-a03",
  "period": "Juli 2026"
}'
curl -s http://localhost:3999/api/rooms | grep -o '"id":"room-a03"[^}]*'
curl -s -X POST http://localhost:3999/api/tenants/tenant-test/move-out -H "Content-Type: application/json" -d '{"roomNumber":"A03"}'
kill %1
rm server/_smoke.js
```

Expected: the tenant POST returns `{ tenant: {...}, room: { "status":"Terisi", "tenantId":"tenant-test", ... }, bill: { "dueDate":"2026-07-05", "totalAmount":1200000, "status":"Belum Bayar", ... } }`. The rooms GET shows `room-a03` as `Terisi`. The move-out POST returns `{ room: { "status":"Kosong", "tenantId":null }, deletedBillIds: ["bill-auto-..."] }`.

- [ ] **Step 4: Commit**

```bash
git add server/db/tenants.js server/db/bills.js server/routes/tenants.js
git commit -m "feat: add tenants routes with auto-bill and move-out business rules"
```

---

### Task 6: Bills resource — data access + routes (payments business rule)

**Files:**
- Modify: `server/db/bills.js` (extend the file created in Task 5 with the remaining functions)
- Create: `server/routes/bills.js`

**Interfaces:**
- Consumes: `db`; `insertBill`, `getBillById` (already in `server/db/bills.js`); `updateTenantStatus`, `getTenantById` from `server/db/tenants.js`; `updateRoomByNumber` from `server/db/rooms.js`.
- Produces (added to `server/db/bills.js`): `listBills()`, `recordBillPayment(id, amountPaid, method, date, notes)`, `deleteBill(id)`, `deleteAllBills()`. `billsRouter` from `server/routes/bills.js`.

- [ ] **Step 1: Extend `server/db/bills.js`**

Add these exports at the end of the existing file (do not touch `rowToBill`, `getBillById`, `insertBill`, `deleteUnpaidBillsForTenant` — they stay as Task 5 left them):

```js
export function listBills() {
  return db.prepare('SELECT * FROM bills ORDER BY due_date DESC').all().map(rowToBill);
}

export function recordBillPayment(id, amountPaid, method, date, notes) {
  const current = getBillById(id);
  if (!current) return null;
  const nextPaid = current.paidAmount + amountPaid;
  const reachedLunas = nextPaid >= current.totalAmount;
  const status = reachedLunas ? 'Lunas' : 'Sebagian';
  db.prepare('UPDATE bills SET paid_amount = ?, status = ?, payment_method = ?, payment_date = ?, notes = ? WHERE id = ?').run(
    nextPaid,
    status,
    method,
    date,
    notes !== undefined ? notes : current.notes || null,
    id
  );
  return getBillById(id);
}

export function deleteBill(id) {
  db.prepare('DELETE FROM bills WHERE id = ?').run(id);
}

export function deleteAllBills() {
  db.prepare('DELETE FROM bills').run();
}
```

- [ ] **Step 2: Write `server/routes/bills.js`**

```js
import { Router } from 'express';
import { db } from '../db/connection.js';
import { listBills, insertBill, deleteBill, recordBillPayment } from '../db/bills.js';
import { updateTenantStatus, getTenantById } from '../db/tenants.js';
import { updateRoomByNumber } from '../db/rooms.js';

export const billsRouter = Router();

billsRouter.get('/', (req, res) => {
  res.json(listBills());
});

billsRouter.post('/', (req, res) => {
  try {
    const result = db.transaction(() => {
      const bill = insertBill(req.body);
      const tenant = updateTenantStatus(bill.tenantId, 'Belum Bayar');
      const room = updateRoomByNumber(bill.roomNumber, { status: 'Terisi' });
      return { bill, tenant, room };
    })();
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

billsRouter.delete('/:id', (req, res) => {
  deleteBill(req.params.id);
  res.status(204).end();
});

billsRouter.post('/:id/payments', (req, res) => {
  const { amountPaid, method, date, notes } = req.body;
  try {
    const result = db.transaction(() => {
      const bill = recordBillPayment(req.params.id, amountPaid, method, date, notes);
      if (!bill) throw new Error('Tagihan tidak ditemukan');
      let tenant = getTenantById(bill.tenantId);
      let room = null;
      if (bill.status === 'Lunas') {
        tenant = updateTenantStatus(bill.tenantId, 'Lunas');
        room = updateRoomByNumber(bill.roomNumber, { status: 'Terisi' });
      }
      return { bill, tenant, room };
    })();
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
```

- [ ] **Step 3: Smoke-test partial then full payment**

Temporary `server/_smoke.js` mounting `roomsRouter`, `tenantsRouter`, `billsRouter` at their respective `/api/*` paths on port 3999 (same pattern as Task 5).

```bash
node server/_smoke.js &
curl -s -X POST http://localhost:3999/api/bills/bill-103/payments -H "Content-Type: application/json" -d '{"amountPaid":500000,"method":"Tunai","date":"2026-06-02"}'
curl -s -X POST http://localhost:3999/api/bills/bill-103/payments -H "Content-Type: application/json" -d '{"amountPaid":830000,"method":"Tunai","date":"2026-06-03"}'
kill %1
rm server/_smoke.js
```

Expected: first response `bill.status = "Sebagian"`, `bill.paidAmount = 500000`, `tenant`/`room` present but unchanged (`room: null` since it wasn't updated — the route only updates room when `status === 'Lunas'`, so check `tenant.status` is still `"Belum Bayar"`). Second response `bill.status = "Lunas"`, `bill.paidAmount = 1330000`, `tenant.status = "Lunas"`, `room.status = "Terisi"`.

- [ ] **Step 4: Commit**

```bash
git add server/db/bills.js server/routes/bills.js
git commit -m "feat: add bills routes with payment-recording business rule"
```

---

### Task 7: Expenses resource — data access + routes

**Files:**
- Create: `server/db/expenses.js`
- Create: `server/routes/expenses.js`

**Interfaces:**
- Consumes: `db`.
- Produces: `listExpenses()`, `insertExpense(expense)`, `deleteExpense(id)`, `deleteAllExpenses()` from `server/db/expenses.js`. `expensesRouter` from `server/routes/expenses.js`. Task 8 (complaints) consumes `insertExpense`.

- [ ] **Step 1: Write `server/db/expenses.js`**

```js
import { db } from './connection.js';

function rowToExpense(row) {
  if (!row) return null;
  return {
    id: row.id,
    category: row.category,
    description: row.description,
    date: row.date,
    amount: row.amount,
    notes: row.notes || undefined,
  };
}

export function listExpenses() {
  return db.prepare('SELECT * FROM expenses ORDER BY date DESC').all().map(rowToExpense);
}

export function insertExpense(expense) {
  db.prepare(`
    INSERT INTO expenses (id, category, description, date, amount, notes)
    VALUES (@id, @category, @description, @date, @amount, @notes)
  `).run({
    id: expense.id,
    category: expense.category,
    description: expense.description,
    date: expense.date,
    amount: expense.amount,
    notes: expense.notes || null,
  });
  return rowToExpense(db.prepare('SELECT * FROM expenses WHERE id = ?').get(expense.id));
}

export function deleteExpense(id) {
  db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
}

export function deleteAllExpenses() {
  db.prepare('DELETE FROM expenses').run();
}
```

- [ ] **Step 2: Write `server/routes/expenses.js`**

```js
import { Router } from 'express';
import { listExpenses, insertExpense, deleteExpense } from '../db/expenses.js';

export const expensesRouter = Router();

expensesRouter.get('/', (req, res) => {
  res.json(listExpenses());
});

expensesRouter.post('/', (req, res) => {
  try {
    res.status(201).json(insertExpense(req.body));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

expensesRouter.delete('/:id', (req, res) => {
  deleteExpense(req.params.id);
  res.status(204).end();
});
```

- [ ] **Step 3: Smoke-test**

Same pattern as prior tasks: temporary `server/_smoke.js` mounting `expensesRouter` at `/api/expenses` on port 3999.

```bash
node server/_smoke.js &
curl -s http://localhost:3999/api/expenses | head -c 200
curl -s -X POST http://localhost:3999/api/expenses -H "Content-Type: application/json" -d '{"id":"exp-test","category":"Lainnya","description":"Test","date":"2026-07-03","amount":10000}'
curl -s -X DELETE -o /dev/null -w "%{http_code}\n" http://localhost:3999/api/expenses/exp-test
kill %1
rm server/_smoke.js
```

Expected: GET returns the 5 seeded expenses; POST returns the created expense; DELETE returns `204`.

- [ ] **Step 4: Commit**

```bash
git add server/db/expenses.js server/routes/expenses.js
git commit -m "feat: add expenses data-access module and REST routes"
```

---

### Task 8: Complaints resource — data access + routes (auto-expense business rule)

**Files:**
- Create: `server/db/complaints.js`
- Create: `server/routes/complaints.js`

**Interfaces:**
- Consumes: `db`; `insertExpense` from `server/db/expenses.js` (Task 7).
- Produces: `listComplaints()`, `getComplaintById(id)`, `insertComplaint(complaint)`, `updateComplaint(id, status, repairCost, notes)`, `deleteComplaint(id)`, `deleteAllComplaints()` from `server/db/complaints.js`. `complaintsRouter` from `server/routes/complaints.js`.

- [ ] **Step 1: Write `server/db/complaints.js`**

```js
import { db } from './connection.js';

function rowToComplaint(row) {
  if (!row) return null;
  return {
    id: row.id,
    tenantId: row.tenant_id,
    tenantName: row.tenant_name,
    roomId: row.room_id,
    roomNumber: row.room_number,
    title: row.title,
    category: row.category,
    status: row.status,
    priority: row.priority,
    date: row.date,
    description: row.description,
    repairCost: row.repair_cost === null ? undefined : row.repair_cost,
    notes: row.notes || undefined,
  };
}

export function listComplaints() {
  return db.prepare('SELECT * FROM complaints ORDER BY date DESC').all().map(rowToComplaint);
}

export function getComplaintById(id) {
  return rowToComplaint(db.prepare('SELECT * FROM complaints WHERE id = ?').get(id));
}

export function insertComplaint(complaint) {
  db.prepare(`
    INSERT INTO complaints (id, tenant_id, tenant_name, room_id, room_number, title, category, status, priority, date, description, repair_cost, notes)
    VALUES (@id, @tenantId, @tenantName, @roomId, @roomNumber, @title, @category, @status, @priority, @date, @description, @repairCost, @notes)
  `).run({
    id: complaint.id,
    tenantId: complaint.tenantId,
    tenantName: complaint.tenantName,
    roomId: complaint.roomId,
    roomNumber: complaint.roomNumber,
    title: complaint.title,
    category: complaint.category,
    status: complaint.status,
    priority: complaint.priority,
    date: complaint.date,
    description: complaint.description,
    repairCost: complaint.repairCost !== undefined ? complaint.repairCost : null,
    notes: complaint.notes || null,
  });
  return getComplaintById(complaint.id);
}

export function updateComplaint(id, status, repairCost, notes) {
  const current = getComplaintById(id);
  if (!current) return null;
  db.prepare('UPDATE complaints SET status = ?, repair_cost = ?, notes = ? WHERE id = ?').run(
    status,
    repairCost !== undefined ? repairCost : (current.repairCost !== undefined ? current.repairCost : null),
    notes !== undefined ? notes : (current.notes || null),
    id
  );
  return getComplaintById(id);
}

export function deleteComplaint(id) {
  db.prepare('DELETE FROM complaints WHERE id = ?').run(id);
}

export function deleteAllComplaints() {
  db.prepare('DELETE FROM complaints').run();
}
```

- [ ] **Step 2: Write `server/routes/complaints.js`**

```js
import { Router } from 'express';
import { db } from '../db/connection.js';
import { listComplaints, insertComplaint, updateComplaint, deleteComplaint, getComplaintById } from '../db/complaints.js';
import { insertExpense } from '../db/expenses.js';

export const complaintsRouter = Router();

complaintsRouter.get('/', (req, res) => {
  res.json(listComplaints());
});

complaintsRouter.post('/', (req, res) => {
  try {
    res.status(201).json(insertComplaint(req.body));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

complaintsRouter.patch('/:id', (req, res) => {
  const { status, repairCost, notes } = req.body;
  try {
    const result = db.transaction(() => {
      const before = getComplaintById(req.params.id);
      if (!before) throw new Error('Komplain tidak ditemukan');
      const complaint = updateComplaint(req.params.id, status, repairCost, notes);
      let expense = null;
      if (status === 'Selesai' && repairCost && repairCost > 0) {
        expense = insertExpense({
          id: `exp-auto-${Date.now()}`,
          category: 'Perbaikan',
          description: `Reparasi komplain: ${complaint.title} (Kmr ${complaint.roomNumber})`,
          date: new Date().toISOString().split('T')[0],
          amount: repairCost,
          notes: notes || 'Pekerjaan selesai via komplain tiket.',
        });
      }
      return { complaint, expense };
    })();
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

complaintsRouter.delete('/:id', (req, res) => {
  deleteComplaint(req.params.id);
  res.status(204).end();
});
```

- [ ] **Step 3: Smoke-test the auto-expense rule**

Temporary `server/_smoke.js` mounting `complaintsRouter` (and `expensesRouter`, to check the side effect) at `/api/complaints` and `/api/expenses` on port 3999.

```bash
node server/_smoke.js &
curl -s -X PATCH http://localhost:3999/api/complaints/comp-1 -H "Content-Type: application/json" -d '{"status":"Selesai","repairCost":75000,"notes":"Sudah beres"}'
curl -s http://localhost:3999/api/expenses | grep -o '"category":"Perbaikan"[^}]*' | head -1
kill %1
rm server/_smoke.js
```

Expected: PATCH returns `{ complaint: { "status":"Selesai", "repairCost":75000, ... }, expense: { "category":"Perbaikan", "amount":75000, "description":"Reparasi komplain: Air Washtafel Bocor (Kmr A01)", ... } }`, and the expenses list now includes that new row.

- [ ] **Step 4: Commit**

```bash
git add server/db/complaints.js server/routes/complaints.js
git commit -m "feat: add complaints routes with auto-expense business rule"
```

---

### Task 9: Onboarding route (first-time kost setup)

**Files:**
- Create: `server/routes/onboarding.js`

**Interfaces:**
- Consumes: `getSettings`, `updateSettings` from `server/db/settings.js`; `insertRoom`, `deleteAllRooms` from `server/db/rooms.js`; `deleteAllTenants` from `server/db/tenants.js`; `deleteAllBills` from `server/db/bills.js`; `deleteAllExpenses` from `server/db/expenses.js`; `deleteAllComplaints` from `server/db/complaints.js`.
- Produces: `onboardingRouter` (mounted at `/api/onboarding` in Task 11).

- [ ] **Step 1: Write `server/routes/onboarding.js`**

```js
import { Router } from 'express';
import { db } from '../db/connection.js';
import { getSettings, updateSettings } from '../db/settings.js';
import { insertRoom, deleteAllRooms } from '../db/rooms.js';
import { deleteAllTenants } from '../db/tenants.js';
import { deleteAllBills } from '../db/bills.js';
import { deleteAllExpenses } from '../db/expenses.js';
import { deleteAllComplaints } from '../db/complaints.js';

export const onboardingRouter = Router();

onboardingRouter.post('/', (req, res) => {
  const { kostConfig = {}, roomCount, basePrice } = req.body;
  try {
    const result = db.transaction(() => {
      const current = getSettings();
      const freshSettings = updateSettings({
        ...current,
        kostName: kostConfig.kostName || 'Kost Saya',
        ownerName: kostConfig.ownerName || 'Pemilik',
        whatsapp: kostConfig.whatsapp || '',
        address: kostConfig.address || '',
        bankAccounts: kostConfig.bankAccounts || current.bankAccounts,
        defaultDueDateDay: kostConfig.defaultDueDateDay || 5,
      });

      deleteAllRooms();
      deleteAllTenants();
      deleteAllBills();
      deleteAllExpenses();
      deleteAllComplaints();

      const freshRooms = [];
      for (let i = 1; i <= roomCount; i++) {
        const roomNo = i < 10 ? `A0${i}` : `A${i}`;
        freshRooms.push(insertRoom({
          id: `room-onb-${i}`,
          number: roomNo,
          status: 'Kosong',
          type: 'Standard',
          price: basePrice,
          floor: 1,
          size: '3x3 m',
          facilities: ['Kipas Angin', 'Kasur Single', 'WiFi', 'Lemari Baju'],
        }));
      }

      return { settings: freshSettings, rooms: freshRooms };
    })();

    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
```

- [ ] **Step 2: Smoke-test**

Temporary `server/_smoke.js` mounting `onboardingRouter` at `/api/onboarding`, `roomsRouter` at `/api/rooms`, `tenantsRouter` at `/api/tenants` on port 3999.

```bash
node server/_smoke.js &
curl -s -X POST http://localhost:3999/api/onboarding -H "Content-Type: application/json" -d '{"kostConfig":{"kostName":"Kost Baru","ownerName":"Budi","whatsapp":"0811","address":"Jl. Baru","defaultDueDateDay":7},"roomCount":3,"basePrice":900000}'
curl -s http://localhost:3999/api/rooms
curl -s http://localhost:3999/api/tenants
kill %1
rm server/_smoke.js
```

Expected: onboarding response has `settings.kostName = "Kost Baru"` and 3 fresh rooms (`A01`, `A02`, `A03`, all `"status":"Kosong"`, `price:900000`). The rooms GET confirms exactly those 3 rooms (old seeded ones gone). Tenants GET returns `[]`.

> This test mutates the dev/seed data irreversibly (wipes rooms/tenants/bills/expenses/complaints). Run it against a throwaway `data/kostos.db` — delete `data/kostos.db` before Task 11's full smoke test so the app re-seeds cleanly, or run this test in a copy of the repo. Do not run this against a DB you want to keep.

- [ ] **Step 3: Commit**

```bash
git add server/routes/onboarding.js
git commit -m "feat: add onboarding route for first-time kost setup"
```

---

### Task 10: Backup / restore routes

**Files:**
- Create: `server/routes/backup.js`

**Interfaces:**
- Consumes: `getSettings`, `updateSettings`; `listRooms`, `insertRoom`, `deleteAllRooms`; `listTenants`, `insertTenant`, `deleteAllTenants`; `listBills`, `insertBill`, `deleteAllBills`; `listExpenses`, `insertExpense`, `deleteAllExpenses`; `listComplaints`, `insertComplaint`, `deleteAllComplaints` — all from the respective `server/db/*.js` modules built in Tasks 3–8.
- Produces: `backupRouter`, exposing `GET /backup` and `POST /restore` (mounted at the API root in Task 11, so the final paths are `/api/backup` and `/api/restore`).

- [ ] **Step 1: Write `server/routes/backup.js`**

```js
import { Router } from 'express';
import { db } from '../db/connection.js';
import { getSettings, updateSettings } from '../db/settings.js';
import { listRooms, insertRoom, deleteAllRooms } from '../db/rooms.js';
import { listTenants, insertTenant, deleteAllTenants } from '../db/tenants.js';
import { listBills, insertBill, deleteAllBills } from '../db/bills.js';
import { listExpenses, insertExpense, deleteAllExpenses } from '../db/expenses.js';
import { listComplaints, insertComplaint, deleteAllComplaints } from '../db/complaints.js';

export const backupRouter = Router();

function fullState() {
  return {
    kostSettings: getSettings(),
    rooms: listRooms(),
    tenants: listTenants(),
    bills: listBills(),
    expenses: listExpenses(),
    complaints: listComplaints(),
  };
}

backupRouter.get('/backup', (req, res) => {
  res.json({
    version: 'Kostos-v1-2026',
    timestamp: new Date().toISOString(),
    ...fullState(),
  });
});

backupRouter.post('/restore', (req, res) => {
  const backupData = req.body;
  if (!backupData || !backupData.version || !backupData.kostSettings) {
    return res.status(400).json({ error: 'Format file JSON backup belum valid.' });
  }
  try {
    const result = db.transaction(() => {
      const settings = updateSettings(backupData.kostSettings);

      deleteAllRooms();
      (backupData.rooms || []).forEach(insertRoom);

      deleteAllTenants();
      (backupData.tenants || []).forEach(insertTenant);

      deleteAllBills();
      (backupData.bills || []).forEach(insertBill);

      deleteAllExpenses();
      (backupData.expenses || []).forEach(insertExpense);

      deleteAllComplaints();
      (backupData.complaints || []).forEach(insertComplaint);

      return { ...fullState(), kostSettings: settings };
    })();
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: 'Gagal membaca berkas backup. Pastikan file JSON sah.' });
  }
});
```

`fullState()` already re-reads `getSettings()`, which after `updateSettings(...)` returns the identical value as `settings` — the explicit `kostSettings: settings` after the spread is just documentation-by-code that the just-written value is the authoritative one, not a functional override.

- [ ] **Step 2: Smoke-test backup and restore round-trip**

Temporary `server/_smoke.js` mounting every router (`roomsRouter` at `/api/rooms`, ..., `backupRouter` at `/api` root) on port 3999.

```bash
node server/_smoke.js &
curl -s http://localhost:3999/api/backup -o /tmp/kostos-backup-test.json
cat /tmp/kostos-backup-test.json | head -c 200
curl -s -X POST http://localhost:3999/api/restore -H "Content-Type: application/json" -d @/tmp/kostos-backup-test.json | head -c 200
kill %1
rm server/_smoke.js /tmp/kostos-backup-test.json
```

Expected: GET `/api/backup` returns `{"version":"Kostos-v1-2026", ..., "rooms":[...8 rooms...], ...}`; POST `/api/restore` with that same payload returns `200` with the identical dataset back (a true round trip — restoring a backup of the current state must not change it).

- [ ] **Step 3: Commit**

```bash
git add server/routes/backup.js
git commit -m "feat: add backup export/restore routes"
```

---

### Task 11: Wire the API app, dev server, and prod server

**Files:**
- Create: `server/app.js`
- Create: `server/index.js`
- Modify: `server.js`

**Interfaces:**
- Consumes: every `*Router` from `server/routes/*.js` (Tasks 3–10).
- Produces: `createApiApp()` from `server/app.js`, returning an Express `Router` with `express.json()` and all resource routers mounted — this is what both `server/index.js` (dev, port 3001) and `server.js` (prod, single port) mount at `/api`.

- [ ] **Step 1: Write `server/app.js`**

```js
import express from 'express';
import { roomsRouter } from './routes/rooms.js';
import { tenantsRouter } from './routes/tenants.js';
import { billsRouter } from './routes/bills.js';
import { expensesRouter } from './routes/expenses.js';
import { complaintsRouter } from './routes/complaints.js';
import { settingsRouter } from './routes/settings.js';
import { onboardingRouter } from './routes/onboarding.js';
import { backupRouter } from './routes/backup.js';

export function createApiApp() {
  const api = express.Router();
  api.use(express.json());

  api.use('/rooms', roomsRouter);
  api.use('/tenants', tenantsRouter);
  api.use('/bills', billsRouter);
  api.use('/expenses', expensesRouter);
  api.use('/complaints', complaintsRouter);
  api.use('/settings', settingsRouter);
  api.use('/onboarding', onboardingRouter);
  api.use('/', backupRouter);

  return api;
}
```

- [ ] **Step 2: Write `server/index.js`**

```js
import express from 'express';
import dotenv from 'dotenv';
import { createApiApp } from './app.js';

dotenv.config();

const app = express();
const port = process.env.API_PORT || 3001;

app.use('/api', createApiApp());

app.listen(port, () => {
  console.log(`🔌 API dev server running on http://localhost:${port}`);
});
```

- [ ] **Step 3: Modify `server.js`** to mount the API alongside the static build

Replace the full contents of `server.js`:

```js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createApiApp } from './server/app.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use('/api', createApiApp());

// Serve static files from the Vite build directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle SPA routing - return index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`🚀 Production server is running on http://localhost:${port}`);
});
```

- [ ] **Step 4: Delete `data/kostos.db`** so the next boot re-seeds cleanly (Task 9's smoke test wiped it)

Run: `rm -f data/kostos.db data/kostos.db-wal data/kostos.db-shm`

- [ ] **Step 5: Run the full API standalone and verify every route is reachable**

Run: `npm run dev:api` (leave running), then in another shell:

```bash
curl -s http://localhost:3001/api/rooms | python3 -c "import sys,json; print(len(json.load(sys.stdin)))"
curl -s http://localhost:3001/api/tenants | python3 -c "import sys,json; print(len(json.load(sys.stdin)))"
curl -s http://localhost:3001/api/bills | python3 -c "import sys,json; print(len(json.load(sys.stdin)))"
curl -s http://localhost:3001/api/expenses | python3 -c "import sys,json; print(len(json.load(sys.stdin)))"
curl -s http://localhost:3001/api/complaints | python3 -c "import sys,json; print(len(json.load(sys.stdin)))"
curl -s http://localhost:3001/api/settings | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['kostName'])"
curl -s http://localhost:3001/api/backup -o /dev/null -w "%{http_code}\n"
```

(If `python3` isn't available, `node -e "process.stdin.on('data', d => console.log(JSON.parse(d).length || d.toString().slice(0,80)))"` piped the same way works too.)

Expected: `8`, `4`, `4`, `5`, `3`, `Kost Mawar Indah`, `200`. Stop the server (`Ctrl+C` or `kill`).

- [ ] **Step 6: Verify the full dev workflow (Vite + API together)**

Run: `npm run dev` (leave running). In another shell: `curl -s http://localhost:3000/api/settings | head -c 60` — expected: valid JSON starting with `{"kostName":"Kost Mawar Indah"...` proxied through Vite. Stop with `Ctrl+C`.

- [ ] **Step 7: Verify the prod path builds and serves the API**

```bash
npm run build
npm run start &
sleep 1
curl -s http://localhost:3000/api/rooms -o /dev/null -w "%{http_code}\n"
curl -s http://localhost:3000/ -o /dev/null -w "%{http_code}\n"
kill %1
```

Expected: both `200`.

- [ ] **Step 8: Commit**

```bash
git add server/app.js server/index.js server.js
git commit -m "feat: wire API routes into dev (port 3001) and prod servers"
```

---

### Task 12: Frontend API client

**Files:**
- Create: `src/api.ts`

**Interfaces:**
- Consumes: types from `src/types.ts` (`Room`, `Tenant`, `Bill`, `Expense`, `Complaint`, `KostSettings`, `RoomStatus`, `ComplaintStatus`) — no changes to that file.
- Produces (consumed by `src/App.tsx` in Tasks 13–16): `getRooms`, `addRoom`, `updateRoomStatus`, `deleteRoom`, `getTenants`, `addTenant`, `moveOutTenant`, `deleteTenant`, `getBills`, `addBill`, `deleteBill`, `recordPayment`, `getExpenses`, `addExpense`, `deleteExpense`, `getComplaints`, `addComplaint`, `updateComplaintStatus`, `deleteComplaint`, `getSettings`, `updateSettings`, `onboardKost`, `getBackup`, `restoreBackup`, plus the `BackupData` interface.

- [ ] **Step 1: Write `src/api.ts`**

```ts
import { Room, Tenant, Bill, Expense, Complaint, KostSettings, RoomStatus, ComplaintStatus } from './types';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Permintaan API gagal (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// Rooms
export const getRooms = () => request<Room[]>('/rooms');
export const addRoom = (room: Room) =>
  request<Room>('/rooms', { method: 'POST', body: JSON.stringify(room) });
export const updateRoomStatus = (id: string, status: RoomStatus, tenantId?: string) =>
  request<Room>(`/rooms/${id}`, { method: 'PATCH', body: JSON.stringify({ status, tenantId }) });
export const deleteRoom = (id: string) => request<void>(`/rooms/${id}`, { method: 'DELETE' });

// Tenants
export const getTenants = () => request<Tenant[]>('/tenants');
export const addTenant = (tenant: Tenant, assignedRoomId: string, period: string) =>
  request<{ tenant: Tenant; room: Room; bill: Bill }>('/tenants', {
    method: 'POST',
    body: JSON.stringify({ tenant, assignedRoomId, period }),
  });
export const moveOutTenant = (tenantId: string, roomNumber: string) =>
  request<{ room: Room; deletedBillIds: string[] }>(`/tenants/${tenantId}/move-out`, {
    method: 'POST',
    body: JSON.stringify({ roomNumber }),
  });
export const deleteTenant = (id: string) => request<void>(`/tenants/${id}`, { method: 'DELETE' });

// Bills
export const getBills = () => request<Bill[]>('/bills');
export const addBill = (bill: Bill) =>
  request<{ bill: Bill; tenant: Tenant; room: Room | null }>('/bills', {
    method: 'POST',
    body: JSON.stringify(bill),
  });
export const deleteBill = (id: string) => request<void>(`/bills/${id}`, { method: 'DELETE' });
export const recordPayment = (billId: string, amountPaid: number, method: string, date: string, notes?: string) =>
  request<{ bill: Bill; tenant: Tenant | null; room: Room | null }>(`/bills/${billId}/payments`, {
    method: 'POST',
    body: JSON.stringify({ amountPaid, method, date, notes }),
  });

// Expenses
export const getExpenses = () => request<Expense[]>('/expenses');
export const addExpense = (expense: Expense) =>
  request<Expense>('/expenses', { method: 'POST', body: JSON.stringify(expense) });
export const deleteExpense = (id: string) => request<void>(`/expenses/${id}`, { method: 'DELETE' });

// Complaints
export const getComplaints = () => request<Complaint[]>('/complaints');
export const addComplaint = (complaint: Complaint) =>
  request<Complaint>('/complaints', { method: 'POST', body: JSON.stringify(complaint) });
export const updateComplaintStatus = (id: string, status: ComplaintStatus, repairCost?: number, notes?: string) =>
  request<{ complaint: Complaint; expense: Expense | null }>(`/complaints/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, repairCost, notes }),
  });
export const deleteComplaint = (id: string) => request<void>(`/complaints/${id}`, { method: 'DELETE' });

// Settings
export const getSettings = () => request<KostSettings>('/settings');
export const updateSettings = (settings: KostSettings) =>
  request<KostSettings>('/settings', { method: 'PUT', body: JSON.stringify(settings) });
export const onboardKost = (kostConfig: Partial<KostSettings>, roomCount: number, basePrice: number) =>
  request<{ settings: KostSettings; rooms: Room[] }>('/onboarding', {
    method: 'POST',
    body: JSON.stringify({ kostConfig, roomCount, basePrice }),
  });

// Backup / restore
export interface BackupData {
  version: string;
  timestamp: string;
  kostSettings: KostSettings;
  rooms: Room[];
  tenants: Tenant[];
  bills: Bill[];
  expenses: Expense[];
  complaints: Complaint[];
}
export const getBackup = () => request<BackupData>('/backup');
export const restoreBackup = (data: BackupData) =>
  request<BackupData>('/restore', { method: 'POST', body: JSON.stringify(data) });
```

- [ ] **Step 2: Type-check**

Run: `npm run lint` (this project's `lint` script is `tsc --noEmit`)
Expected: no errors referencing `src/api.ts` (existing pre-existing errors elsewhere, if any, are out of scope for this task).

- [ ] **Step 3: Commit**

```bash
git add src/api.ts
git commit -m "feat: add frontend API client wrapping the backend REST endpoints"
```

---

### Task 13: App.tsx — replace localStorage bootstrap with API fetch, add shared toast

**Files:**
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: every function from `src/api.ts` (Task 12).
- Produces: a `showToast(type, text)` helper and `toast` state used by every handler rewritten in Tasks 14–16.

- [ ] **Step 1: Update imports**

Replace:

```tsx
import { Room, Tenant, Bill, Expense, Complaint, KostSettings, ComplaintStatus, RoomStatus, TenantStatus } from './types';
import { 
  INITIAL_SETTINGS, 
  INITIAL_ROOMS, 
  INITIAL_TENANTS, 
  INITIAL_BILLS, 
  INITIAL_EXPENSES, 
  INITIAL_COMPLAINTS 
} from './data';
```

with:

```tsx
import { Room, Tenant, Bill, Expense, Complaint, KostSettings, ComplaintStatus, RoomStatus } from './types';
import { INITIAL_SETTINGS } from './data';
import * as api from './api';
```

(`TenantStatus` is no longer referenced once Task 14 removes the client-side status flips that used it — if `tsc` still flags it as unused after Task 16, drop it then; leave it for now since Task 14/15 still touch tenant status types indirectly through `Tenant` object shapes.)

- [ ] **Step 2: Replace the two `useEffect` blocks (load-on-mount, sync-on-change) and the `backupMsg` state**

Delete the entire block from `// 1. INITIALIZE DATABASE FROM LOCALSTORAGE OR FALLBACK SEEDS` through the end of `// 2. SYNCHRONIZE STATE TO LOCALSTORAGE` (i.e. everything from the first `useEffect(() => { try { const loggedIn ...` down through the `useEffect(() => { localStorage.setItem('kostos_settings', ...`), and replace it with:

```tsx
  // 1. LOAD DATABASE FROM THE API ON MOUNT
  useEffect(() => {
    try {
      const loggedIn = localStorage.getItem('kostos_logged_in');
      if (loggedIn === 'true') setAuthMode('dashboard');
    } catch { /* ignore */ }

    Promise.all([
      api.getSettings(),
      api.getRooms(),
      api.getTenants(),
      api.getBills(),
      api.getExpenses(),
      api.getComplaints(),
    ])
      .then(([settingsData, roomsData, tenantsData, billsData, expensesData, complaintsData]) => {
        setKostSettings(settingsData);
        setRooms(roomsData);
        setTenants(tenantsData);
        setBills(billsData);
        setExpenses(expensesData);
        setComplaints(complaintsData);
      })
      .catch((err: Error) => showToast('error', `Gagal memuat data dari server: ${err.message}`));
  }, []);
```

- [ ] **Step 3: Add the shared toast helper**

Find `const [backupMsg, setBackupMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);` (currently below `handleExportBackup`) and delete that line — it will be replaced by the block below, placed right after the state declarations near the top of the component (immediately after the `mobileMenuOpen` state, before `// Focus detail overlays`):

```tsx
  // Shared toast for API success/error feedback across every handler
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };
```

- [ ] **Step 4: Update the toast render at the bottom of the component**

Replace:

```tsx
      {/* 4. GLOBAL TOAST NOTIFICATION for backup/restore feedback */}
      {backupMsg && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-2xl text-xs font-bold shadow-xl text-white animate-in slide-in-from-bottom-4 duration-300 ${
          backupMsg.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
        }`}>
          {backupMsg.text}
        </div>
      )}
```

with:

```tsx
      {/* 4. GLOBAL TOAST NOTIFICATION for API success/error feedback */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-2xl text-xs font-bold shadow-xl text-white animate-in slide-in-from-bottom-4 duration-300 ${
          toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
        }`}>
          {toast.text}
        </div>
      )}
```

- [ ] **Step 5: Verify it compiles (handlers not yet rewritten will still reference removed things — expected to fail until Task 14–16 finish)**

Run: `npm run lint`
Expected: TypeScript errors only about handlers still doing `localStorage.setItem('kostos_rooms', ...)` etc. inside `handleAddRoom`/`handleFirstTimeOnboard`/`handleImportBackup` (those are fixed in Tasks 14–16) and about `backupMsg` no longer existing where still referenced. Confirm there are **no** errors about `toast`, `showToast`, or the `api` import — those three must already type-check cleanly.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx
git commit -m "refactor(App): load initial data from the API and add a shared toast"
```

---

### Task 14: App.tsx — rewire Rooms and Tenants handlers to the API

**Files:**
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `api.addRoom`, `api.updateRoomStatus`, `api.deleteRoom`, `api.addTenant`, `api.moveOutTenant`, `api.deleteTenant` (Task 12); `showToast` (Task 13).

- [ ] **Step 1: Replace `handleAddRoom`, `handleUpdateRoomStatus`, `handleDeleteRoom`**

```tsx
  const handleAddRoom = async (newRoom: Room) => {
    try {
      const created = await api.addRoom(newRoom);
      setRooms(prev => [...prev, created]);
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleUpdateRoomStatus = async (roomId: string, nextStatus: RoomStatus) => {
    try {
      const updated = await api.updateRoomStatus(roomId, nextStatus);
      setRooms(prev => prev.map(r => (r.id === roomId ? updated : r)));
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleDeleteRoom = async (id: string) => {
    try {
      await api.deleteRoom(id);
      setRooms(prev => prev.filter(r => r.id !== id));
    } catch (err: any) {
      showToast('error', err.message);
    }
  };
```

- [ ] **Step 2: Replace `handleAddTenant`, `handleMoveOutTenant`, `handleDeleteTenant`**

The old `handleAddTenant` computed the due date and built the bill client-side using `rooms.find(...)` and a local `computeDueDate` closure — that logic now lives server-side (Task 5). Replace the entire function (from `const handleAddTenant = (newTenant: Tenant, assignedRoomId: string) => {` through its closing `};`, including the nested `computeDueDate` helper and `autoInceptionBill`) with:

```tsx
  const handleAddTenant = async (newTenant: Tenant, assignedRoomId: string) => {
    try {
      const { tenant, room, bill } = await api.addTenant(newTenant, assignedRoomId, selectedMonth);
      setTenants(prev => [...prev, tenant]);
      setRooms(prev => prev.map(r => (r.id === room.id ? room : r)));
      setBills(prev => [bill, ...prev]);
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleMoveOutTenant = async (tenantId: string, roomNumber: string) => {
    try {
      const { room, deletedBillIds } = await api.moveOutTenant(tenantId, roomNumber);
      setTenants(prev => prev.filter(t => t.id !== tenantId));
      setRooms(prev => prev.map(r => (r.id === room.id ? room : r)));
      setBills(prev => prev.filter(b => !deletedBillIds.includes(b.id)));
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleDeleteTenant = async (id: string) => {
    try {
      await api.deleteTenant(id);
      setTenants(prev => prev.filter(t => t.id !== id));
    } catch (err: any) {
      showToast('error', err.message);
    }
  };
```

- [ ] **Step 3: Manual verification in the browser**

Run: `npm run dev`, open `http://localhost:3000`, log in via the demo/landing flow. In the Rooms tab, add a room and confirm it appears without a page reload; open its detail modal and toggle "Tandai Perbaikan" / "Perbaikan Selesai" and confirm the status badge updates; delete it and confirm it disappears. In the Tenants tab, register a new tenant into an empty room and confirm: the tenant card appears, the room's status flips to `Terisi` in the Rooms tab, and a new `Belum Bayar` bill appears in the Bills tab for the current month. Then open that tenant's profile and click "Keluar Kost" — confirm the tenant disappears, the room returns to `Kosong`, and the auto-created bill is gone from Bills.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "refactor(App): rewire rooms and tenants handlers to the API"
```

---

### Task 15: App.tsx — rewire Bills, Payments, Expenses, Complaints handlers to the API

**Files:**
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `api.addBill`, `api.deleteBill`, `api.recordPayment`, `api.addExpense`, `api.deleteExpense`, `api.addComplaint`, `api.updateComplaintStatus`, `api.deleteComplaint` (Task 12); `showToast` (Task 13).

- [ ] **Step 1: Replace `handleAddBill`, `handleDeleteBill`, `handleRecordPayment`**

```tsx
  const handleAddBill = async (newBill: Bill) => {
    try {
      const { bill, tenant, room } = await api.addBill(newBill);
      setBills(prev => [bill, ...prev]);
      setTenants(prev => prev.map(t => (t.id === tenant.id ? tenant : t)));
      if (room) setRooms(prev => prev.map(r => (r.id === room.id ? room : r)));
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleDeleteBill = async (id: string) => {
    try {
      await api.deleteBill(id);
      setBills(prev => prev.filter(b => b.id !== id));
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleRecordPayment = async (billId: string, amountPaid: number, method: string, date: string, notes?: string) => {
    try {
      const { bill, tenant, room } = await api.recordPayment(billId, amountPaid, method, date, notes);
      setBills(prev => prev.map(b => (b.id === bill.id ? bill : b)));
      if (tenant) setTenants(prev => prev.map(t => (t.id === tenant.id ? tenant : t)));
      if (room) setRooms(prev => prev.map(r => (r.id === room.id ? room : r)));
    } catch (err: any) {
      showToast('error', err.message);
    }
  };
```

- [ ] **Step 2: Replace `handleAddExpense`, `handleDeleteExpense`**

```tsx
  const handleAddExpense = async (newExpense: Expense) => {
    try {
      const created = await api.addExpense(newExpense);
      setExpenses(prev => [created, ...prev]);
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      await api.deleteExpense(id);
      setExpenses(prev => prev.filter(e => e.id !== id));
    } catch (err: any) {
      showToast('error', err.message);
    }
  };
```

- [ ] **Step 3: Replace `handleAddComplaint`, `handleUpdateComplaintStatus`, `handleDeleteComplaint`**

```tsx
  const handleAddComplaint = async (newComplaint: Complaint) => {
    try {
      const created = await api.addComplaint(newComplaint);
      setComplaints(prev => [created, ...prev]);
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleUpdateComplaintStatus = async (id: string, status: ComplaintStatus, repairCost?: number, notes?: string) => {
    try {
      const { complaint, expense } = await api.updateComplaintStatus(id, status, repairCost, notes);
      setComplaints(prev => prev.map(c => (c.id === complaint.id ? complaint : c)));
      if (expense) setExpenses(prev => [expense, ...prev]);
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleDeleteComplaint = async (id: string) => {
    try {
      await api.deleteComplaint(id);
      setComplaints(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      showToast('error', err.message);
    }
  };
```

- [ ] **Step 4: Manual verification in the browser**

With `npm run dev` running: in Bills, create a manual bill for a tenant and confirm it appears and the tenant's status flips to `Belum Bayar`. In Payments, record a partial payment on a bill and confirm its status becomes `Sebagian`; record the remaining balance and confirm it becomes `Lunas` and the tenant/room statuses update accordingly. In Expenses, add and delete an expense. In Complaints, create a complaint, then resolve it with a repair cost and confirm a matching `Perbaikan` expense appears automatically in the Expenses tab.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "refactor(App): rewire bills, payments, expenses, complaints handlers to the API"
```

---

### Task 16: App.tsx — rewire Settings, Onboarding, and Backup/Restore to the API

**Files:**
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `api.updateSettings`, `api.onboardKost`, `api.getBackup`, `api.restoreBackup` (Task 12); `showToast` (Task 13).

- [ ] **Step 1: Replace `handleUpdateSettings`**

```tsx
  const handleUpdateSettings = async (newSettings: KostSettings) => {
    try {
      const updated = await api.updateSettings(newSettings);
      setKostSettings(updated);
    } catch (err: any) {
      showToast('error', err.message);
    }
  };
```

- [ ] **Step 2: Replace `handleFirstTimeOnboard`**

Replace the entire function (it currently builds `freshSettings`/`freshRooms` client-side and writes six `localStorage` keys) with:

```tsx
  const handleFirstTimeOnboard = async (kostConfig: Partial<KostSettings>, roomCount: number, basePrice: number) => {
    try {
      const { settings, rooms: freshRooms } = await api.onboardKost(kostConfig, roomCount, basePrice);
      setKostSettings(settings);
      setRooms(freshRooms);
      setTenants([]);
      setBills([]);
      setExpenses([]);
      setComplaints([]);
      localStorage.setItem('kostos_logged_in', 'true');
      setAuthMode('dashboard');
    } catch (err: any) {
      showToast('error', err.message);
    }
  };
```

- [ ] **Step 3: Replace `handleExportBackup` and `handleImportBackup`**

Replace both functions (and remove the now-redundant `backupMsg` references inside `handleImportBackup` if any remain from Task 13) with:

```tsx
  const handleExportBackup = async () => {
    try {
      const data = await api.getBackup();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `kostos_db_backup_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const backupData = JSON.parse(e.target?.result as string);
        const restored = await api.restoreBackup(backupData);
        setKostSettings(restored.kostSettings);
        setRooms(restored.rooms);
        setTenants(restored.tenants);
        setBills(restored.bills);
        setExpenses(restored.expenses);
        setComplaints(restored.complaints);
        showToast('success', '✓ Database KOSTOS sukses dipulihkan dari file backup!');
      } catch (err: any) {
        showToast('error', err.message || '⚠️ Gagal membaca berkas backup. Pastikan file JSON sah.');
      }
    };
    reader.readAsText(file);
  };
```

- [ ] **Step 4: Full type-check**

Run: `npm run lint`
Expected: no errors. If `TenantStatus` (kept as an import in Task 13 Step 1) is now unused, remove it from the `types` import line.

- [ ] **Step 5: Full manual QA pass (mirrors the spec's testing section)**

With `npm run dev` running against a freshly seeded `data/kostos.db` (delete it first if it was mutated during earlier smoke tests, then restart so it re-seeds):

1. Walk every menu (Rooms, Tenants, Bills, Payments, Expenses, Complaints, Settings) performing at least one create, update, and delete.
2. In Settings, edit the kost profile and bank account, confirm the save toast and the new values persist after a manual page refresh (proves it's server-backed, not component state).
3. Stop the dev server (`Ctrl+C`), restart it (`npm run dev`), and confirm all data from step 1–2 is still present — this is the proof it's in SQLite, not memory.
4. Re-verify the four cross-entity rules end-to-end through the UI: add tenant → auto bill + room flips to `Terisi`; move out → room clears + unpaid bills drop; pay a bill to full → bill/tenant/room all flip to `Lunas`/`Terisi`; resolve a complaint with a repair cost → matching expense appears.
5. In Settings → Backup, export a backup file, then import it back via the restore button, and confirm the success toast and that the data is unchanged.
6. Trigger an error path: stop the API server while the frontend is open, then try to add a room — confirm the red error toast appears instead of a silent failure or a crash.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx
git commit -m "refactor(App): rewire settings, onboarding, and backup/restore handlers to the API"
```

---

## Post-plan notes

- `src/data.ts` still exports `INITIAL_SETTINGS` (used as the pre-fetch default React state) but its `INITIAL_ROOMS`/`INITIAL_TENANTS`/`INITIAL_BILLS`/`INITIAL_EXPENSES`/`INITIAL_COMPLAINTS` exports become dead code once Task 13 lands — left in place rather than deleted, since removing them is a separate cleanup decision the user may want to make explicitly (they document the original seed shape and `server/db/seed-data.js` intentionally duplicates rather than imports them, per Task 2's note on avoiding TS/JS interop at runtime).
- The pre-existing uncommitted changes on `main` (in `src/App.tsx`, `src/components/BillsView.tsx`, etc., visible in `git status` before this plan started) are unrelated to this feature and are not touched by any task above — they'll ride along in the same working tree but originate from prior work.
