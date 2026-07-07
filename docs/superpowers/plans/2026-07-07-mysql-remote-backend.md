# Remote MySQL Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the `/api/*` Express backend the frontend already calls, backed by a remote MySQL database (Hostinger hPanel) configured via `.env`.

**Architecture:** Express REST API under `/api/*` using a `mysql2/promise` pool. New `server/` folder holds db bootstrap (`db.js`), data access (`repo.js`), seed data, and one router per resource; `server/app.js` is shared by the dev entry (`server/index.js`, port 3001) and the existing prod `server.js` (one process serving `dist/` + API). Dev runs Vite + API via `concurrently` with a Vite `/api` proxy.

**Tech Stack:** Node 18+ ESM, Express 4 (existing), `mysql2` (new), `dotenv` (existing), `concurrently` (new devDep). No ORM, no test framework (project has none — verification is a smoke script + manual).

**Spec:** `docs/superpowers/specs/2026-07-07-mysql-remote-backend-design.md`

## Global Constraints

- Env vars (exact names): `DB_HOST`, `DB_PORT` (default 3306), `DB_USER`, `DB_PASSWORD`, `DB_NAME`, optional `PORT`. `.env` is gitignored; `.env.example` is committed.
- IDs are client-generated strings → `VARCHAR(64)` primary keys. All money values are integer rupiah → `INT`.
- Every `POST` of a full entity is an **upsert** (`INSERT ... ON DUPLICATE KEY UPDATE`) — the optimistic client may retry syncs.
- JSON columns may come back as strings (MariaDB) or objects (MySQL 8) — always run them through `parseJson()`.
- The server must boot even when the DB is unreachable; routes then return 503 fast (pool `connectTimeout: 5000`), which flips the existing frontend into localStorage offline mode.
- Server-side business rules must mirror `src/App.tsx` exactly (see Tasks 5–6). The client syncs the complaint auto-expense itself, so the server must NOT create it (would duplicate).
- Restarting the server must never wipe or re-seed existing data: seed only when ALL six tables are empty.
- Charset `utf8mb4`. Keep pool small (`connectionLimit: 5`) — shared hosting caps connections.

## File Structure

- Create: `server/db.js` (pool, schema, init-once guard, seeding), `server/repo.js` (row mappers + CRUD helpers, all functions take a `db` handle as first arg), `server/seed-data.js` (JS mirror of `src/data.ts`), `server/routes/{settings,rooms,tenants,bills,expenses,complaints,restore}.js`, `server/app.js`, `server/index.js`, `.env.example`, `scripts/smoke-api.mjs`
- Modify: `package.json` (deps + scripts), `vite.config.ts` (proxy), `server.js` (mount API), `.gitignore` (`.env`, `data/`), `src/App.tsx` (2 sync calls), `PANDUAN_DEPLOY_CPANEL.md`

---

### Task 1: Dependencies, env scaffolding, dev workflow

**Files:**
- Modify: `package.json`, `vite.config.ts`, `.gitignore`
- Create: `.env.example`

**Interfaces:**
- Produces: `npm run dev` (Vite 3000 + API 3001), `npm run dev:api`, `/api` proxy → `http://localhost:3001`.

- [ ] **Step 1: Install dependencies**

```bash
npm install mysql2
npm install -D concurrently
```

- [ ] **Step 2: Update `package.json` scripts** (keep everything else):

```json
"scripts": {
  "dev": "concurrently -k -n web,api \"npm:dev:web\" \"npm:dev:api\"",
  "dev:web": "vite --port=3000 --host=0.0.0.0",
  "dev:api": "node server/index.js",
  "build": "vite build",
  "preview": "vite preview",
  "start": "node server.js",
  "clean": "rm -rf dist",
  "lint": "tsc --noEmit"
}
```

(Note: remove `server.js` from `clean` — it is now source code, not an artifact.)

- [ ] **Step 3: Add `/api` proxy to `vite.config.ts`** — inside the returned `server: {...}` object add:

```ts
proxy: {
  '/api': 'http://localhost:3001',
},
```

- [ ] **Step 4: Create `.env.example`**

```
# Koneksi MySQL remote (dari hPanel Hostinger -> Databases -> MySQL Databases)
DB_HOST=isi-hostname-mysql-dari-hpanel
DB_PORT=3306
DB_USER=isi-username-database
DB_PASSWORD=isi-password-database
DB_NAME=isi-nama-database

# Port server production (opsional, default 3000)
# PORT=3000
```

- [ ] **Step 5: Append to `.gitignore`**

```
.env
```

- [ ] **Step 6: Verify** — run `npm run lint` (must pass, nothing TS changed materially) and `node -e "import('mysql2/promise').then(()=>console.log('mysql2 ok'))"` → prints `mysql2 ok`.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vite.config.ts .env.example .gitignore
git commit -m "chore: add mysql2/concurrently, env template, and /api dev proxy"
```

---

### Task 2: Seed data module

**Files:**
- Create: `server/seed-data.js`

**Interfaces:**
- Produces: named exports `INITIAL_SETTINGS` (object), `INITIAL_ROOMS`, `INITIAL_TENANTS`, `INITIAL_BILLS`, `INITIAL_EXPENSES`, `INITIAL_COMPLAINTS` (arrays) — identical values to `src/data.ts`.

- [ ] **Step 1: Create `server/seed-data.js`** — open `src/data.ts` and transcribe its entire contents verbatim into plain ESM JavaScript: delete the `import type` line, delete every type annotation (`: KostSettings`, `: Room[]`, etc.), keep every object literal and value byte-identical, keep the same six `export const` names.

- [ ] **Step 2: Verify it parses and mirrors the source**

```bash
node -e "import('./server/seed-data.js').then(m => console.log(m.INITIAL_ROOMS.length, m.INITIAL_TENANTS.length, m.INITIAL_BILLS.length, m.INITIAL_EXPENSES.length, m.INITIAL_COMPLAINTS.length, m.INITIAL_SETTINGS.kostName))"
```

Expected: five counts matching the array lengths in `src/data.ts` and the kost name string, no errors.

- [ ] **Step 3: Commit**

```bash
git add server/seed-data.js
git commit -m "feat(server): add seed data mirrored from src/data.ts"
```

---

### Task 3: Database bootstrap (`db.js`) and data access (`repo.js`)

**Files:**
- Create: `server/db.js`, `server/repo.js`

**Interfaces:**
- Consumes: `server/seed-data.js` exports (Task 2).
- Produces (used by all routes, Tasks 4–6):
  - `db.js`: `getPool(): Pool`, `ensureInit(): Promise<void>` (idempotent, retries after failure), `parseJson(v, fallback)`, `stripNulls(obj)`.
  - `repo.js` (every function takes `db` — a pool or connection — as first arg):
    `listRooms(db)`, `getRoom(db,id)`, `upsertRoom(db,room)`, `deleteRoom(db,id)`,
    `listTenants(db)`, `getTenant(db,id)`, `upsertTenant(db,t)`, `deleteTenant(db,id)`,
    `listBills(db)`, `getBill(db,id)`, `upsertBill(db,b)`, `deleteBill(db,id)`,
    `listExpenses(db)`, `upsertExpense(db,e)`, `deleteExpense(db,id)`,
    `listComplaints(db)`, `getComplaint(db,id)`, `upsertComplaint(db,c)`, `deleteComplaint(db,id)`,
    `getSettings(db)`, `putSettings(db,s)`.
    All `list*`/`get*` return frontend-shaped objects (JSON parsed, nulls stripped).

- [ ] **Step 1: Create `server/db.js`**

```js
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import * as seed from './seed-data.js';
import { upsertRoom, upsertTenant, upsertBill, upsertExpense, upsertComplaint, putSettings } from './repo.js';

dotenv.config();

let pool = null;
let initPromise = null;

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 5,
      connectTimeout: 5000,
      charset: 'utf8mb4_unicode_ci',
    });
  }
  return pool;
}

export const parseJson = (v, fallback) => {
  if (v == null) return fallback;
  if (typeof v === 'string') {
    try { return JSON.parse(v); } catch { return fallback; }
  }
  return v;
};

export const stripNulls = (obj) => {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== null && v !== undefined) out[k] = v;
  }
  return out;
};

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS rooms (
    id VARCHAR(64) PRIMARY KEY,
    seq INT NOT NULL AUTO_INCREMENT, UNIQUE KEY rooms_seq (seq),
    number VARCHAR(32) NOT NULL,
    status VARCHAR(16) NOT NULL,
    type VARCHAR(16) NOT NULL,
    price INT NOT NULL DEFAULT 0,
    floor INT NOT NULL DEFAULT 1,
    size VARCHAR(32) NOT NULL DEFAULT '',
    facilities JSON,
    tenantId VARCHAR(64) NULL,
    notes TEXT NULL,
    lastMaintenanceDate VARCHAR(32) NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS tenants (
    id VARCHAR(64) PRIMARY KEY,
    seq INT NOT NULL AUTO_INCREMENT, UNIQUE KEY tenants_seq (seq),
    name VARCHAR(191) NOT NULL,
    phone VARCHAR(32) NOT NULL DEFAULT '',
    email VARCHAR(191) NOT NULL DEFAULT '',
    emergencyContact JSON,
    idNumber VARCHAR(64) NOT NULL DEFAULT '',
    roomAssigned VARCHAR(64) NOT NULL DEFAULT '',
    moveInDate VARCHAR(32) NOT NULL DEFAULT '',
    rentAmount INT NOT NULL DEFAULT 0,
    deposit INT NOT NULL DEFAULT 0,
    status VARCHAR(16) NOT NULL,
    notes TEXT NULL,
    idPhotoUrl TEXT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS bills (
    id VARCHAR(64) PRIMARY KEY,
    seq INT NOT NULL AUTO_INCREMENT, UNIQUE KEY bills_seq (seq),
    tenantId VARCHAR(64) NOT NULL,
    tenantName VARCHAR(191) NOT NULL DEFAULT '',
    roomId VARCHAR(64) NOT NULL DEFAULT '',
    roomNumber VARCHAR(32) NOT NULL DEFAULT '',
    period VARCHAR(32) NOT NULL DEFAULT '',
    dueDate VARCHAR(32) NOT NULL DEFAULT '',
    rentAmount INT NOT NULL DEFAULT 0,
    electricityCharge INT NOT NULL DEFAULT 0,
    waterCharge INT NOT NULL DEFAULT 0,
    additionalFee INT NOT NULL DEFAULT 0,
    discount INT NOT NULL DEFAULT 0,
    lateFee INT NOT NULL DEFAULT 0,
    totalAmount INT NOT NULL DEFAULT 0,
    paidAmount INT NOT NULL DEFAULT 0,
    status VARCHAR(16) NOT NULL,
    paymentMethod VARCHAR(64) NULL,
    paymentDate VARCHAR(32) NULL,
    notes TEXT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS expenses (
    id VARCHAR(64) PRIMARY KEY,
    seq INT NOT NULL AUTO_INCREMENT, UNIQUE KEY expenses_seq (seq),
    category VARCHAR(32) NOT NULL,
    description TEXT NOT NULL,
    date VARCHAR(32) NOT NULL DEFAULT '',
    amount INT NOT NULL DEFAULT 0,
    notes TEXT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS complaints (
    id VARCHAR(64) PRIMARY KEY,
    seq INT NOT NULL AUTO_INCREMENT, UNIQUE KEY complaints_seq (seq),
    tenantId VARCHAR(64) NOT NULL DEFAULT '',
    tenantName VARCHAR(191) NOT NULL DEFAULT '',
    roomId VARCHAR(64) NOT NULL DEFAULT '',
    roomNumber VARCHAR(32) NOT NULL DEFAULT '',
    title TEXT NOT NULL,
    category VARCHAR(32) NOT NULL,
    status VARCHAR(16) NOT NULL,
    priority VARCHAR(16) NOT NULL,
    date VARCHAR(32) NOT NULL DEFAULT '',
    description TEXT NOT NULL,
    repairCost INT NULL,
    notes TEXT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS settings (
    id TINYINT PRIMARY KEY,
    data JSON NOT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
];

async function initOnce() {
  const p = getPool();
  for (const sql of SCHEMA) await p.query(sql);

  // Seed ONLY when the entire database is empty (first boot ever).
  const tables = ['rooms', 'tenants', 'bills', 'expenses', 'complaints', 'settings'];
  let total = 0;
  for (const t of tables) {
    const [rows] = await p.query(`SELECT COUNT(*) AS n FROM ${t}`);
    total += Number(rows[0].n);
  }
  if (total > 0) return;

  await putSettings(p, seed.INITIAL_SETTINGS);
  for (const r of seed.INITIAL_ROOMS) await upsertRoom(p, r);
  for (const t of seed.INITIAL_TENANTS) await upsertTenant(p, t);
  for (const b of seed.INITIAL_BILLS) await upsertBill(p, b);
  for (const e of seed.INITIAL_EXPENSES) await upsertExpense(p, e);
  for (const c of seed.INITIAL_COMPLAINTS) await upsertComplaint(p, c);
  console.log('✅ Database di-seed dengan data contoh (database kosong).');
}

export function ensureInit() {
  if (!initPromise) {
    initPromise = initOnce().catch((err) => {
      initPromise = null; // retry lazily on the next request
      throw err;
    });
  }
  return initPromise;
}
```

- [ ] **Step 2: Create `server/repo.js`**

```js
import { parseJson, stripNulls } from './db.js';
import { INITIAL_SETTINGS } from './seed-data.js';

// ---------- rooms ----------
const rowToRoom = (r) => stripNulls({
  id: r.id, number: r.number, status: r.status, type: r.type,
  price: r.price, floor: r.floor, size: r.size,
  facilities: parseJson(r.facilities, []),
  tenantId: r.tenantId, notes: r.notes, lastMaintenanceDate: r.lastMaintenanceDate,
});

export async function listRooms(db) {
  const [rows] = await db.query('SELECT * FROM rooms ORDER BY seq ASC');
  return rows.map(rowToRoom);
}

export async function getRoom(db, id) {
  const [rows] = await db.query('SELECT * FROM rooms WHERE id = ?', [id]);
  return rows[0] ? rowToRoom(rows[0]) : null;
}

export async function upsertRoom(db, r) {
  await db.query(
    `INSERT INTO rooms (id, number, status, type, price, floor, size, facilities, tenantId, notes, lastMaintenanceDate)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE number=VALUES(number), status=VALUES(status), type=VALUES(type),
       price=VALUES(price), floor=VALUES(floor), size=VALUES(size), facilities=VALUES(facilities),
       tenantId=VALUES(tenantId), notes=VALUES(notes), lastMaintenanceDate=VALUES(lastMaintenanceDate)`,
    [r.id, r.number, r.status, r.type, r.price ?? 0, r.floor ?? 1, r.size ?? '',
     JSON.stringify(r.facilities ?? []), r.tenantId ?? null, r.notes ?? null, r.lastMaintenanceDate ?? null]
  );
}

export async function deleteRoom(db, id) {
  await db.query('DELETE FROM rooms WHERE id = ?', [id]);
}

// ---------- tenants ----------
const rowToTenant = (r) => stripNulls({
  id: r.id, name: r.name, phone: r.phone, email: r.email,
  emergencyContact: parseJson(r.emergencyContact, { name: '', relation: '', phone: '' }),
  idNumber: r.idNumber, roomAssigned: r.roomAssigned, moveInDate: r.moveInDate,
  rentAmount: r.rentAmount, deposit: r.deposit, status: r.status,
  notes: r.notes, idPhotoUrl: r.idPhotoUrl,
});

export async function listTenants(db) {
  const [rows] = await db.query('SELECT * FROM tenants ORDER BY seq ASC');
  return rows.map(rowToTenant);
}

export async function getTenant(db, id) {
  const [rows] = await db.query('SELECT * FROM tenants WHERE id = ?', [id]);
  return rows[0] ? rowToTenant(rows[0]) : null;
}

export async function upsertTenant(db, t) {
  await db.query(
    `INSERT INTO tenants (id, name, phone, email, emergencyContact, idNumber, roomAssigned, moveInDate, rentAmount, deposit, status, notes, idPhotoUrl)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE name=VALUES(name), phone=VALUES(phone), email=VALUES(email),
       emergencyContact=VALUES(emergencyContact), idNumber=VALUES(idNumber), roomAssigned=VALUES(roomAssigned),
       moveInDate=VALUES(moveInDate), rentAmount=VALUES(rentAmount), deposit=VALUES(deposit),
       status=VALUES(status), notes=VALUES(notes), idPhotoUrl=VALUES(idPhotoUrl)`,
    [t.id, t.name, t.phone ?? '', t.email ?? '',
     JSON.stringify(t.emergencyContact ?? { name: '', relation: '', phone: '' }),
     t.idNumber ?? '', t.roomAssigned ?? '', t.moveInDate ?? '',
     t.rentAmount ?? 0, t.deposit ?? 0, t.status, t.notes ?? null, t.idPhotoUrl ?? null]
  );
}

export async function deleteTenant(db, id) {
  await db.query('DELETE FROM tenants WHERE id = ?', [id]);
}

// ---------- bills ----------
const rowToBill = (r) => stripNulls({
  id: r.id, tenantId: r.tenantId, tenantName: r.tenantName, roomId: r.roomId,
  roomNumber: r.roomNumber, period: r.period, dueDate: r.dueDate,
  rentAmount: r.rentAmount, electricityCharge: r.electricityCharge, waterCharge: r.waterCharge,
  additionalFee: r.additionalFee, discount: r.discount, lateFee: r.lateFee,
  totalAmount: r.totalAmount, paidAmount: r.paidAmount, status: r.status,
  paymentMethod: r.paymentMethod, paymentDate: r.paymentDate, notes: r.notes,
});

export async function listBills(db) {
  const [rows] = await db.query('SELECT * FROM bills ORDER BY seq DESC');
  return rows.map(rowToBill);
}

export async function getBill(db, id) {
  const [rows] = await db.query('SELECT * FROM bills WHERE id = ?', [id]);
  return rows[0] ? rowToBill(rows[0]) : null;
}

export async function upsertBill(db, b) {
  await db.query(
    `INSERT INTO bills (id, tenantId, tenantName, roomId, roomNumber, period, dueDate, rentAmount,
       electricityCharge, waterCharge, additionalFee, discount, lateFee, totalAmount, paidAmount,
       status, paymentMethod, paymentDate, notes)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE tenantId=VALUES(tenantId), tenantName=VALUES(tenantName), roomId=VALUES(roomId),
       roomNumber=VALUES(roomNumber), period=VALUES(period), dueDate=VALUES(dueDate),
       rentAmount=VALUES(rentAmount), electricityCharge=VALUES(electricityCharge), waterCharge=VALUES(waterCharge),
       additionalFee=VALUES(additionalFee), discount=VALUES(discount), lateFee=VALUES(lateFee),
       totalAmount=VALUES(totalAmount), paidAmount=VALUES(paidAmount), status=VALUES(status),
       paymentMethod=VALUES(paymentMethod), paymentDate=VALUES(paymentDate), notes=VALUES(notes)`,
    [b.id, b.tenantId, b.tenantName ?? '', b.roomId ?? '', b.roomNumber ?? '', b.period ?? '',
     b.dueDate ?? '', b.rentAmount ?? 0, b.electricityCharge ?? 0, b.waterCharge ?? 0,
     b.additionalFee ?? 0, b.discount ?? 0, b.lateFee ?? 0, b.totalAmount ?? 0, b.paidAmount ?? 0,
     b.status, b.paymentMethod ?? null, b.paymentDate ?? null, b.notes ?? null]
  );
}

export async function deleteBill(db, id) {
  await db.query('DELETE FROM bills WHERE id = ?', [id]);
}

// ---------- expenses ----------
const rowToExpense = (r) => stripNulls({
  id: r.id, category: r.category, description: r.description,
  date: r.date, amount: r.amount, notes: r.notes,
});

export async function listExpenses(db) {
  const [rows] = await db.query('SELECT * FROM expenses ORDER BY seq DESC');
  return rows.map(rowToExpense);
}

export async function upsertExpense(db, e) {
  await db.query(
    `INSERT INTO expenses (id, category, description, date, amount, notes)
     VALUES (?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE category=VALUES(category), description=VALUES(description),
       date=VALUES(date), amount=VALUES(amount), notes=VALUES(notes)`,
    [e.id, e.category, e.description ?? '', e.date ?? '', e.amount ?? 0, e.notes ?? null]
  );
}

export async function deleteExpense(db, id) {
  await db.query('DELETE FROM expenses WHERE id = ?', [id]);
}

// ---------- complaints ----------
const rowToComplaint = (r) => stripNulls({
  id: r.id, tenantId: r.tenantId, tenantName: r.tenantName, roomId: r.roomId,
  roomNumber: r.roomNumber, title: r.title, category: r.category, status: r.status,
  priority: r.priority, date: r.date, description: r.description,
  repairCost: r.repairCost, notes: r.notes,
});

export async function listComplaints(db) {
  const [rows] = await db.query('SELECT * FROM complaints ORDER BY seq DESC');
  return rows.map(rowToComplaint);
}

export async function getComplaint(db, id) {
  const [rows] = await db.query('SELECT * FROM complaints WHERE id = ?', [id]);
  return rows[0] ? rowToComplaint(rows[0]) : null;
}

export async function upsertComplaint(db, c) {
  await db.query(
    `INSERT INTO complaints (id, tenantId, tenantName, roomId, roomNumber, title, category, status, priority, date, description, repairCost, notes)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE tenantId=VALUES(tenantId), tenantName=VALUES(tenantName), roomId=VALUES(roomId),
       roomNumber=VALUES(roomNumber), title=VALUES(title), category=VALUES(category), status=VALUES(status),
       priority=VALUES(priority), date=VALUES(date), description=VALUES(description),
       repairCost=VALUES(repairCost), notes=VALUES(notes)`,
    [c.id, c.tenantId ?? '', c.tenantName ?? '', c.roomId ?? '', c.roomNumber ?? '', c.title,
     c.category, c.status, c.priority, c.date ?? '', c.description ?? '', c.repairCost ?? null, c.notes ?? null]
  );
}

export async function deleteComplaint(db, id) {
  await db.query('DELETE FROM complaints WHERE id = ?', [id]);
}

// ---------- settings (singleton row id=1) ----------
export async function getSettings(db) {
  const [rows] = await db.query('SELECT data FROM settings WHERE id = 1');
  if (!rows[0]) {
    await putSettings(db, INITIAL_SETTINGS);
    return INITIAL_SETTINGS;
  }
  return parseJson(rows[0].data, INITIAL_SETTINGS);
}

export async function putSettings(db, s) {
  await db.query(
    'INSERT INTO settings (id, data) VALUES (1, ?) ON DUPLICATE KEY UPDATE data=VALUES(data)',
    [JSON.stringify(s)]
  );
}
```

(Note: `db.js` imports from `repo.js` and `repo.js` imports `parseJson`/`stripNulls` from `db.js`. This ESM cycle is safe — both sides only use the imports at call time, not at module-evaluation time — but if you prefer, move `parseJson`/`stripNulls` into a tiny `server/util.js`; either is acceptable.)

- [ ] **Step 3: Verify against the real database** — requires a filled `.env`. If `.env` isn't available yet, run the failure-path check only (second command).

```bash
node -e "import('./server/db.js').then(m => m.ensureInit()).then(() => { console.log('init ok'); process.exit(0); }).catch(e => { console.error('init failed:', e.message); process.exit(1); })"
```

Expected with valid `.env`: `init ok`, and on first ever run the seed log line. Run it twice — the second run must NOT print the seed line (no re-seed).
Expected without `.env`/unreachable DB: `init failed: ...` within ~5 seconds (fail fast, no hang).

- [ ] **Step 4: Commit**

```bash
git add server/db.js server/repo.js
git commit -m "feat(server): mysql pool, schema init with seed-once, and data access layer"
```

---

### Task 4: Simple CRUD routes — settings, rooms, expenses, complaints

**Files:**
- Create: `server/routes/settings.js`, `server/routes/rooms.js`, `server/routes/expenses.js`, `server/routes/complaints.js`, `server/routes/helpers.js`

**Interfaces:**
- Consumes: `ensureInit`, `getPool` from `../db.js`; repo functions (Task 3).
- Produces: Express routers (default export each). `helpers.js` exports `asyncHandler(fn)` used by every route file (including Tasks 5–6).
- Business rule: `PATCH /api/complaints/:id` only merges provided fields — it must NOT auto-create an expense (the client already syncs that expense via `POST /api/expenses`).

- [ ] **Step 1: Create `server/routes/helpers.js`**

```js
import { ensureInit, getPool } from '../db.js';

// Wraps a route: ensures the DB is initialized, catches errors,
// maps connection failures to 503 so the frontend flips to offline mode.
export const asyncHandler = (fn) => async (req, res) => {
  try {
    await ensureInit();
    await fn(req, res, getPool());
  } catch (err) {
    console.error(`[api] ${req.method} ${req.originalUrl}:`, err.message);
    const connCodes = ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'EHOSTUNREACH', 'PROTOCOL_CONNECTION_LOST', 'ER_ACCESS_DENIED_ERROR'];
    const status = connCodes.includes(err.code) || err.message.includes('connect') ? 503 : 500;
    res.status(status).json({ error: err.message });
  }
};
```

- [ ] **Step 2: Create `server/routes/settings.js`**

```js
import { Router } from 'express';
import { asyncHandler } from './helpers.js';
import { getSettings, putSettings } from '../repo.js';

const router = Router();

router.get('/', asyncHandler(async (req, res, db) => {
  res.json(await getSettings(db));
}));

router.put('/', asyncHandler(async (req, res, db) => {
  await putSettings(db, req.body);
  res.json(req.body);
}));

export default router;
```

- [ ] **Step 3: Create `server/routes/rooms.js`**

```js
import { Router } from 'express';
import { asyncHandler } from './helpers.js';
import { listRooms, getRoom, upsertRoom, deleteRoom } from '../repo.js';

const router = Router();

router.get('/', asyncHandler(async (req, res, db) => {
  res.json(await listRooms(db));
}));

router.post('/', asyncHandler(async (req, res, db) => {
  await upsertRoom(db, req.body);
  res.status(201).json(req.body);
}));

router.patch('/:id', asyncHandler(async (req, res, db) => {
  const room = await getRoom(db, req.params.id);
  if (!room) return res.status(404).json({ error: 'Kamar tidak ditemukan' });
  const merged = { ...room, ...req.body };
  await upsertRoom(db, merged);
  res.json(merged);
}));

router.delete('/:id', asyncHandler(async (req, res, db) => {
  await deleteRoom(db, req.params.id);
  res.json({ ok: true });
}));

export default router;
```

- [ ] **Step 4: Create `server/routes/expenses.js`**

```js
import { Router } from 'express';
import { asyncHandler } from './helpers.js';
import { listExpenses, upsertExpense, deleteExpense } from '../repo.js';

const router = Router();

router.get('/', asyncHandler(async (req, res, db) => {
  res.json(await listExpenses(db));
}));

router.post('/', asyncHandler(async (req, res, db) => {
  await upsertExpense(db, req.body);
  res.status(201).json(req.body);
}));

router.delete('/:id', asyncHandler(async (req, res, db) => {
  await deleteExpense(db, req.params.id);
  res.json({ ok: true });
}));

export default router;
```

- [ ] **Step 5: Create `server/routes/complaints.js`**

```js
import { Router } from 'express';
import { asyncHandler } from './helpers.js';
import { listComplaints, getComplaint, upsertComplaint, deleteComplaint } from '../repo.js';

const router = Router();

router.get('/', asyncHandler(async (req, res, db) => {
  res.json(await listComplaints(db));
}));

router.post('/', asyncHandler(async (req, res, db) => {
  await upsertComplaint(db, req.body);
  res.status(201).json(req.body);
}));

// Merge partial fields only. The client syncs the auto repair-expense itself
// via POST /api/expenses, so do NOT create an expense here (it would duplicate).
router.patch('/:id', asyncHandler(async (req, res, db) => {
  const complaint = await getComplaint(db, req.params.id);
  if (!complaint) return res.status(404).json({ error: 'Komplain tidak ditemukan' });
  const merged = { ...complaint };
  for (const [k, v] of Object.entries(req.body)) {
    if (v !== undefined) merged[k] = v;
  }
  await upsertComplaint(db, merged);
  res.json(merged);
}));

router.delete('/:id', asyncHandler(async (req, res, db) => {
  await deleteComplaint(db, req.params.id);
  res.json({ ok: true });
}));

export default router;
```

- [ ] **Step 6: Syntax check** (routers can't be exercised until `app.js` exists in Task 6):

```bash
node --check server/routes/helpers.js && node --check server/routes/settings.js && node --check server/routes/rooms.js && node --check server/routes/expenses.js && node --check server/routes/complaints.js && echo OK
```

Expected: `OK`.

- [ ] **Step 7: Commit**

```bash
git add server/routes
git commit -m "feat(server): settings, rooms, expenses, complaints routes"
```

---

### Task 5: Business-rule routes — tenants and bills

**Files:**
- Create: `server/routes/tenants.js`, `server/routes/bills.js`

**Interfaces:**
- Consumes: `asyncHandler` (Task 4), repo functions (Task 3).
- Produces: Express routers (default export each).

Business rules — these must mirror `src/App.tsx` because the client applies the same mutations optimistically and only syncs the single triggering call:

1. `POST /api/tenants` (body = Tenant) → upsert tenant; find their room by `id === tenant.roomAssigned` OR `number === tenant.roomAssigned`; set it `Terisi` + `tenantId`; auto-create the first bill (period = current month in Indonesian, dueDate from `settings.defaultDueDateDay`, rent = room price, else tenant.rentAmount). Mirrors `handleAddTenant` (App.tsx:127–178, which sends only the tenant and expects the backend to create the bill).
2. `POST /api/tenants/:id/move-out` → delete the tenant's non-`Lunas` bills, free their room (`Kosong`, `tenantId` NULL), **delete the tenant row** (the client removes the tenant from state entirely — App.tsx:180–188).
3. `POST /api/bills` (body = Bill) → upsert bill; set tenant status `Belum Bayar`; set room (by `roomNumber`) `Terisi` (App.tsx:195–204).
4. `POST /api/bills/:id/payments` (body `{ amountPaid, method, date, notes }`) → add to `paidAmount`; status `Lunas` when `paidAmount >= totalAmount`, else `Sebagian`; store `paymentMethod`/`paymentDate`; keep old notes when none given; when `Lunas`, set tenant status `Lunas` and room (by `roomNumber`) `Terisi` (App.tsx:211–240).

- [ ] **Step 1: Create `server/routes/tenants.js`**

```js
import { Router } from 'express';
import { asyncHandler } from './helpers.js';
import {
  listTenants, getTenant, upsertTenant, deleteTenant,
  listRooms, upsertRoom, upsertBill, getSettings,
} from '../repo.js';

const router = Router();

const MONTHS_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

router.get('/', asyncHandler(async (req, res, db) => {
  res.json(await listTenants(db));
}));

// Mirrors handleAddTenant in App.tsx: the client sends only the tenant and
// expects the backend to flip the room and create the first bill.
router.post('/', asyncHandler(async (req, res, db) => {
  const tenant = req.body;
  await upsertTenant(db, tenant);

  const rooms = await listRooms(db);
  const room = rooms.find(r => r.id === tenant.roomAssigned || r.number === tenant.roomAssigned);
  if (room) {
    await upsertRoom(db, { ...room, status: 'Terisi', tenantId: tenant.id });
  }

  const settings = await getSettings(db);
  const now = new Date();
  const period = `${MONTHS_ID[now.getMonth()]} ${now.getFullYear()}`;
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(settings.defaultDueDateDay || 5).padStart(2, '0');
  const rentAmount = room ? room.price : (tenant.rentAmount ?? 0);

  await upsertBill(db, {
    id: `bill-auto-${Date.now()}`,
    tenantId: tenant.id,
    tenantName: tenant.name,
    roomId: room ? room.id : '',
    roomNumber: room ? room.number : (tenant.roomAssigned ?? ''),
    period,
    dueDate: `${now.getFullYear()}-${month}-${day}`,
    rentAmount,
    electricityCharge: 0, waterCharge: 0, additionalFee: 0,
    discount: 0, lateFee: 0,
    totalAmount: rentAmount,
    paidAmount: 0,
    status: 'Belum Bayar',
  });

  res.status(201).json(tenant);
}));

// Mirrors handleMoveOutTenant in App.tsx: the client deletes the tenant,
// frees the room, and drops unpaid bills — all from this single call.
router.post('/:id/move-out', asyncHandler(async (req, res, db) => {
  const tenant = await getTenant(db, req.params.id);
  if (!tenant) return res.status(404).json({ error: 'Penghuni tidak ditemukan' });

  await db.query("DELETE FROM bills WHERE tenantId = ? AND status != 'Lunas'", [tenant.id]);
  await db.query(
    'UPDATE rooms SET status = ?, tenantId = NULL WHERE tenantId = ? OR number = ? OR id = ?',
    ['Kosong', tenant.id, tenant.roomAssigned, tenant.roomAssigned]
  );
  await deleteTenant(db, tenant.id);

  res.json({ ok: true });
}));

router.delete('/:id', asyncHandler(async (req, res, db) => {
  await deleteTenant(db, req.params.id);
  res.json({ ok: true });
}));

export default router;
```

- [ ] **Step 2: Create `server/routes/bills.js`**

```js
import { Router } from 'express';
import { asyncHandler } from './helpers.js';
import { listBills, getBill, upsertBill, deleteBill } from '../repo.js';

const router = Router();

router.get('/', asyncHandler(async (req, res, db) => {
  res.json(await listBills(db));
}));

// Mirrors handleAddBill in App.tsx: new bill also flips tenant to
// 'Belum Bayar' and the room to 'Terisi'.
router.post('/', asyncHandler(async (req, res, db) => {
  const bill = req.body;
  await upsertBill(db, bill);
  await db.query('UPDATE tenants SET status = ? WHERE id = ?', ['Belum Bayar', bill.tenantId]);
  await db.query('UPDATE rooms SET status = ? WHERE number = ?', ['Terisi', bill.roomNumber]);
  res.status(201).json(bill);
}));

// Mirrors handleRecordPayment in App.tsx.
router.post('/:id/payments', asyncHandler(async (req, res, db) => {
  const bill = await getBill(db, req.params.id);
  if (!bill) return res.status(404).json({ error: 'Tagihan tidak ditemukan' });

  const { amountPaid = 0, method, date, notes } = req.body;
  const nextPaid = (bill.paidAmount ?? 0) + Number(amountPaid);
  const reachedLunas = nextPaid >= bill.totalAmount;

  const updated = {
    ...bill,
    paidAmount: nextPaid,
    status: reachedLunas ? 'Lunas' : 'Sebagian',
    paymentMethod: method,
    paymentDate: date,
    notes: notes || bill.notes,
  };
  await upsertBill(db, updated);

  if (reachedLunas) {
    await db.query('UPDATE tenants SET status = ? WHERE id = ?', ['Lunas', bill.tenantId]);
    await db.query('UPDATE rooms SET status = ? WHERE number = ?', ['Terisi', bill.roomNumber]);
  }

  res.json(updated);
}));

router.delete('/:id', asyncHandler(async (req, res, db) => {
  await deleteBill(db, req.params.id);
  res.json({ ok: true });
}));

export default router;
```

- [ ] **Step 3: Syntax check**

```bash
node --check server/routes/tenants.js && node --check server/routes/bills.js && echo OK
```

Expected: `OK`.

- [ ] **Step 4: Commit**

```bash
git add server/routes/tenants.js server/routes/bills.js
git commit -m "feat(server): tenants and bills routes with cross-entity business rules"
```

---

### Task 6: App assembly — dev server, prod server, restore endpoint, frontend sync

**Files:**
- Create: `server/app.js`, `server/index.js`, `server/routes/restore.js`
- Modify: `server.js`, `src/App.tsx` (two places), `src/api.ts` (no change needed — verify only)

**Interfaces:**
- Consumes: all routers (Tasks 4–5), `ensureInit`/`getPool` (Task 3).
- Produces: `server/app.js` exports `apiRouter` (an Express router mounting all `/…` resource routers) — consumed by both `server/index.js` and `server.js`. `POST /api/restore` accepts `{ kostSettings, rooms, tenants, bills, expenses, complaints }` and replaces the whole database in a transaction.

Background: `handleFirstTimeOnboard` (App.tsx:292–332) and `handleImportBackup` (App.tsx:381–409) currently write only to localStorage — without a sync, the next `fetchAllData()` would clobber onboarding/restored data with old server data. One bulk endpoint fixes both.

- [ ] **Step 1: Create `server/routes/restore.js`**

```js
import { Router } from 'express';
import { asyncHandler } from './helpers.js';
import { getPool } from '../db.js';
import {
  putSettings, upsertRoom, upsertTenant, upsertBill, upsertExpense, upsertComplaint,
} from '../repo.js';

const router = Router();

// Full replace of the database. Used by onboarding and backup-restore.
router.post('/', asyncHandler(async (req, res) => {
  const { kostSettings, rooms = [], tenants = [], bills = [], expenses = [], complaints = [] } = req.body;
  if (!kostSettings) return res.status(400).json({ error: 'kostSettings wajib ada' });

  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    for (const t of ['bills', 'complaints', 'expenses', 'tenants', 'rooms']) {
      await conn.query(`DELETE FROM ${t}`);
    }
    await putSettings(conn, kostSettings);
    for (const r of rooms) await upsertRoom(conn, r);
    for (const t of tenants) await upsertTenant(conn, t);
    for (const b of bills) await upsertBill(conn, b);
    for (const e of expenses) await upsertExpense(conn, e);
    for (const c of complaints) await upsertComplaint(conn, c);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
  res.json({ ok: true });
}));

export default router;
```

- [ ] **Step 2: Create `server/app.js`**

```js
import { Router, json } from 'express';
import settingsRouter from './routes/settings.js';
import roomsRouter from './routes/rooms.js';
import tenantsRouter from './routes/tenants.js';
import billsRouter from './routes/bills.js';
import expensesRouter from './routes/expenses.js';
import complaintsRouter from './routes/complaints.js';
import restoreRouter from './routes/restore.js';

export function apiRouter() {
  const router = Router();
  router.use(json({ limit: '5mb' }));
  router.use('/settings', settingsRouter);
  router.use('/rooms', roomsRouter);
  router.use('/tenants', tenantsRouter);
  router.use('/bills', billsRouter);
  router.use('/expenses', expensesRouter);
  router.use('/complaints', complaintsRouter);
  router.use('/restore', restoreRouter);
  return router;
}
```

- [ ] **Step 3: Create `server/index.js`** (dev API entry — API only, port 3001):

```js
import express from 'express';
import dotenv from 'dotenv';
import { apiRouter } from './app.js';
import { ensureInit } from './db.js';

dotenv.config();

const app = express();
const port = process.env.API_PORT || 3001;

app.use('/api', apiRouter());

app.listen(port, () => {
  console.log(`🔌 API server (dev) berjalan di http://localhost:${port}`);
  ensureInit()
    .then(() => console.log('✅ Koneksi MySQL siap.'))
    .catch((err) => console.warn(`⚠️ MySQL belum terjangkau (${err.message}). Frontend akan fallback ke mode offline.`));
});
```

- [ ] **Step 4: Rewrite `server.js`** (prod: static + API, one port):

```js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { apiRouter } from './server/app.js';
import { ensureInit } from './server/db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use('/api', apiRouter());

// Serve static files from the Vite build directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle SPA routing - return index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`🚀 Production server is running on http://localhost:${port}`);
  ensureInit()
    .then(() => console.log('✅ Koneksi MySQL siap.'))
    .catch((err) => console.warn(`⚠️ MySQL belum terjangkau (${err.message}). Frontend akan fallback ke mode offline.`));
});
```

- [ ] **Step 5: Sync onboarding to backend** — in `src/App.tsx`, at the end of `handleFirstTimeOnboard` (after `localStorage.setItem('kostos_logged_in', 'true');`, before `setAuthMode('dashboard');`), add:

```ts
    syncToBackend('restore', 'POST', {
      kostSettings: freshSettings,
      rooms: freshRooms,
      tenants: [],
      bills: [],
      expenses: [],
      complaints: []
    });
```

- [ ] **Step 6: Sync backup-restore to backend** — in `handleImportBackup`, inside the `if (backupData.version && backupData.kostSettings)` block, right before `setBackupMsg({ type: 'success', ... })`, add:

```ts
          syncToBackend('restore', 'POST', {
            kostSettings: backupData.kostSettings,
            rooms: backupData.rooms || [],
            tenants: backupData.tenants || [],
            bills: backupData.bills || [],
            expenses: backupData.expenses || [],
            complaints: backupData.complaints || []
          });
```

- [ ] **Step 7: Verify boot + fail-fast without DB** — temporarily rename `.env` if it exists, then:

```bash
node server/index.js &
sleep 2
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/api/settings
kill %1
```

Expected: server prints the boot line and the ⚠️ warning (does not crash); curl prints `503` (within ~5s). Restore `.env`.

- [ ] **Step 8: Verify full stack with DB** (requires valid `.env`): run `npm run dev`, open http://localhost:3000 — the app must load the seeded sample data (not localStorage fallback; check the browser console has no `[Hybrid API]` offline warning). Then `npm run lint` → passes.

- [ ] **Step 9: Commit**

```bash
git add server/app.js server/index.js server/routes/restore.js server.js src/App.tsx
git commit -m "feat: assemble API server for dev+prod, restore endpoint, onboarding/backup sync"
```

---

### Task 7: Smoke test script

**Files:**
- Create: `scripts/smoke-api.mjs`

**Interfaces:**
- Consumes: a running API server (`npm run dev:api` or `npm run start`) with a reachable MySQL.

- [ ] **Step 1: Create `scripts/smoke-api.mjs`**

```js
// Behavioural smoke test. Usage: node scripts/smoke-api.mjs [baseUrl]
// Requires the API server running with a reachable MySQL.
const BASE = process.argv[2] || 'http://localhost:3001';
let failed = 0;

const call = async (method, path, body) => {
  const res = await fetch(`${BASE}/api/${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} /api/${path} -> ${res.status}`);
  return res.json();
};

const check = (name, cond) => {
  console.log(`${cond ? '  ✅' : '  ❌'} ${name}`);
  if (!cond) failed++;
};

const ts = Date.now();

// settings
const settings = await call('GET', 'settings');
check('GET settings returns kostName', typeof settings.kostName === 'string');

// rooms CRUD
const room = { id: `smoke-room-${ts}`, number: `Z${ts % 1000}`, status: 'Kosong', type: 'Standard', price: 500000, floor: 9, size: '3x3 m', facilities: ['WiFi'] };
await call('POST', 'rooms', room);
let rooms = await call('GET', 'rooms');
check('POST room persists', rooms.some(r => r.id === room.id && r.facilities[0] === 'WiFi'));
await call('PATCH', `rooms/${room.id}`, { status: 'Perbaikan' });
rooms = await call('GET', 'rooms');
check('PATCH room status', rooms.find(r => r.id === room.id)?.status === 'Perbaikan');

// tenant -> auto bill + room flip
const tenant = { id: `smoke-tenant-${ts}`, name: 'Smoke Tester', phone: '08123', email: 's@t.id', emergencyContact: { name: 'X', relation: 'Y', phone: '0' }, idNumber: '1', roomAssigned: room.id, moveInDate: '2026-07-07', rentAmount: 500000, deposit: 0, status: 'Belum Bayar' };
await call('POST', 'tenants', tenant);
rooms = await call('GET', 'rooms');
check('room becomes Terisi with tenantId', rooms.find(r => r.id === room.id)?.tenantId === tenant.id);
let bills = await call('GET', 'bills');
const autoBill = bills.find(b => b.tenantId === tenant.id);
check('auto bill created for tenant', !!autoBill && autoBill.totalAmount === 500000 && autoBill.status === 'Belum Bayar');

// partial then full payment
await call('POST', `bills/${autoBill.id}/payments`, { amountPaid: 200000, method: 'Tunai', date: '2026-07-07' });
bills = await call('GET', 'bills');
check('partial payment -> Sebagian', bills.find(b => b.id === autoBill.id)?.status === 'Sebagian');
await call('POST', `bills/${autoBill.id}/payments`, { amountPaid: 300000, method: 'Tunai', date: '2026-07-07' });
bills = await call('GET', 'bills');
check('full payment -> Lunas', bills.find(b => b.id === autoBill.id)?.status === 'Lunas');
let tenants = await call('GET', 'tenants');
check('tenant flips to Lunas', tenants.find(t => t.id === tenant.id)?.status === 'Lunas');

// expense + complaint CRUD
const expense = { id: `smoke-exp-${ts}`, category: 'Lainnya', description: 'smoke', date: '2026-07-07', amount: 1000 };
await call('POST', 'expenses', expense);
check('POST expense persists', (await call('GET', 'expenses')).some(e => e.id === expense.id));
const complaint = { id: `smoke-comp-${ts}`, tenantId: tenant.id, tenantName: tenant.name, roomId: room.id, roomNumber: room.number, title: 'smoke', category: 'Lainnya', status: 'Baru', priority: 'Rendah', date: '2026-07-07', description: 'smoke' };
await call('POST', 'complaints', complaint);
const expCountBeforePatch = (await call('GET', 'expenses')).length;
await call('PATCH', `complaints/${complaint.id}`, { status: 'Selesai', repairCost: 5000 });
const comps = await call('GET', 'complaints');
check('PATCH complaint merges fields', comps.find(c => c.id === complaint.id)?.status === 'Selesai' && comps.find(c => c.id === complaint.id)?.repairCost === 5000);
check('complaint PATCH did NOT auto-create expense', (await call('GET', 'expenses')).length === expCountBeforePatch);

// move-out: unpaid bill dropped, room freed, tenant deleted
const bill2 = { id: `smoke-bill-${ts}`, tenantId: tenant.id, tenantName: tenant.name, roomId: room.id, roomNumber: room.number, period: 'Juli 2026', dueDate: '2026-07-05', rentAmount: 500000, electricityCharge: 0, waterCharge: 0, additionalFee: 0, discount: 0, lateFee: 0, totalAmount: 500000, paidAmount: 0, status: 'Belum Bayar' };
await call('POST', 'bills', bill2);
await call('POST', `tenants/${tenant.id}/move-out`);
tenants = await call('GET', 'tenants');
bills = await call('GET', 'bills');
rooms = await call('GET', 'rooms');
check('move-out deletes tenant', !tenants.some(t => t.id === tenant.id));
check('move-out drops unpaid bill, keeps Lunas bill', !bills.some(b => b.id === bill2.id) && bills.some(b => b.id === autoBill.id));
check('move-out frees room', rooms.find(r => r.id === room.id)?.status === 'Kosong' && !rooms.find(r => r.id === room.id)?.tenantId);

// cleanup smoke rows
await call('DELETE', `bills/${autoBill.id}`);
await call('DELETE', `complaints/${complaint.id}`);
await call('DELETE', `expenses/${expense.id}`);
await call('DELETE', `rooms/${room.id}`);

console.log(failed === 0 ? '\nSEMUA SMOKE TEST LULUS ✅' : `\n${failed} CHECK GAGAL ❌`);
process.exit(failed === 0 ? 0 : 1);
```

- [ ] **Step 2: Run it** (requires valid `.env` and `npm run dev:api` running in another terminal):

```bash
node scripts/smoke-api.mjs
```

Expected: every line ✅ and exit code 0. If MySQL is not reachable, note that in the task report and defer this run to final verification.

- [ ] **Step 3: Commit**

```bash
git add scripts/smoke-api.mjs
git commit -m "test: add API smoke test script"
```

---

### Task 8: Deployment docs

**Files:**
- Modify: `PANDUAN_DEPLOY_CPANEL.md`

- [ ] **Step 1: Update the intro (line 3–5)** to mention that data is now stored in MySQL remote, and that METODE 2 (Node.js App) is required for the backend; METODE 1 (static) keeps working but runs in offline/localStorage mode only.

- [ ] **Step 2: Add a new section before METODE 2** titled `## Persiapan Database MySQL di hPanel` with these steps:

```markdown
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

6. Tabel dibuat otomatis saat server pertama kali jalan — tidak perlu import SQL manual.
```

- [ ] **Step 3: Update METODE 2** — the ZIP contents list must now include: `dist/`, `server/` (seluruh folder), `server.js`, `package.json`, `package-lock.json`; and add a step: buat file `.env` di root aplikasi Node.js di hPanel dengan isian dari bagian Persiapan Database (di hPanel, `DB_HOST` biasanya `localhost` karena backend dan database ada di server yang sama). Startup file: `server.js`.

- [ ] **Step 4: Commit**

```bash
git add PANDUAN_DEPLOY_CPANEL.md
git commit -m "docs: deployment guide for remote MySQL + Node.js App on hPanel"
```

---

## Final Verification (after all tasks)

1. `npm run lint` → passes.
2. With valid `.env`: `npm run dev`, open http://localhost:3000, walk through every menu (Rooms, Tenants, Bills, Payments, Expenses, Complaints, Settings): create/update/delete in each, then **restart the API server** and reload — data must survive (proof it lives in MySQL, not memory/localStorage).
3. `node scripts/smoke-api.mjs` → all ✅.
4. Rename `.env` away, restart API, reload the app → console shows the offline warning and the app still works from localStorage. Restore `.env`.
5. `npm run build && npm run start` → production server on one port serves the app AND `/api/settings` returns JSON.
