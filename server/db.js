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

// Table names with prefix to avoid conflicts with other apps sharing the same DB
export const T = {
  rooms: 'kostos_rooms',
  tenants: 'kostos_tenants',
  bills: 'kostos_bills',
  expenses: 'kostos_expenses',
  complaints: 'kostos_complaints',
  settings: 'kostos_settings',
};

// Base schema — CREATE TABLE IF NOT EXISTS (idempotent, safe on every boot)
const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS ${T.rooms} (
    id VARCHAR(64) PRIMARY KEY,
    seq INT NOT NULL AUTO_INCREMENT, UNIQUE KEY rooms_seq (seq),
    number VARCHAR(32) NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'Kosong',
    housekeepingStatus VARCHAR(32) NOT NULL DEFAULT 'Bersih',
    type VARCHAR(16) NOT NULL DEFAULT 'Standard',
    price INT NOT NULL DEFAULT 0,
    pricePerDay INT NOT NULL DEFAULT 0,
    pricePerMonth INT NOT NULL DEFAULT 0,
    pricePerWeek INT NOT NULL DEFAULT 0,
    rentalTypesAllowed JSON,
    floor INT NOT NULL DEFAULT 1,
    size VARCHAR(32) NOT NULL DEFAULT '',
    maxGuests INT NOT NULL DEFAULT 2,
    facilities JSON,
    images JSON,
    description TEXT NULL,
    tenantId VARCHAR(64) NULL,
    notes TEXT NULL,
    lastMaintenanceDate VARCHAR(32) NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS ${T.tenants} (
    id VARCHAR(64) PRIMARY KEY,
    seq INT NOT NULL AUTO_INCREMENT, UNIQUE KEY tenants_seq (seq),
    name VARCHAR(191) NOT NULL,
    phone VARCHAR(32) NOT NULL DEFAULT '',
    email VARCHAR(191) NOT NULL DEFAULT '',
    guestType VARCHAR(16) NOT NULL DEFAULT 'Bulanan',
    checkInDate VARCHAR(32) NULL,
    checkOutDate VARCHAR(32) NULL,
    idType VARCHAR(16) NOT NULL DEFAULT 'KTP',
    vehicleNumber VARCHAR(32) NULL,
    totalGuests INT NOT NULL DEFAULT 1,
    bookingOrigin VARCHAR(32) NOT NULL DEFAULT 'Walk-in',
    emergencyContact JSON,
    idNumber VARCHAR(64) NOT NULL DEFAULT '',
    roomAssigned VARCHAR(64) NOT NULL DEFAULT '',
    moveInDate VARCHAR(32) NOT NULL DEFAULT '',
    rentAmount INT NOT NULL DEFAULT 0,
    deposit INT NOT NULL DEFAULT 0,
    status VARCHAR(16) NOT NULL DEFAULT 'Belum Bayar',
    notes TEXT NULL,
    idPhotoUrl TEXT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS ${T.bills} (
    id VARCHAR(64) PRIMARY KEY,
    seq INT NOT NULL AUTO_INCREMENT, UNIQUE KEY bills_seq (seq),
    tenantId VARCHAR(64) NOT NULL,
    tenantName VARCHAR(191) NOT NULL DEFAULT '',
    roomId VARCHAR(64) NOT NULL DEFAULT '',
    roomNumber VARCHAR(32) NOT NULL DEFAULT '',
    rentalType VARCHAR(16) NOT NULL DEFAULT 'Bulanan',
    stayDuration INT NOT NULL DEFAULT 1,
    checkInDate VARCHAR(32) NULL,
    checkOutDate VARCHAR(32) NULL,
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
    status VARCHAR(16) NOT NULL DEFAULT 'Belum Bayar',
    paymentMethod VARCHAR(64) NULL,
    paymentDate VARCHAR(32) NULL,
    notes TEXT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS ${T.expenses} (
    id VARCHAR(64) PRIMARY KEY,
    seq INT NOT NULL AUTO_INCREMENT, UNIQUE KEY expenses_seq (seq),
    category VARCHAR(32) NOT NULL,
    description TEXT NOT NULL,
    date VARCHAR(32) NOT NULL DEFAULT '',
    amount INT NOT NULL DEFAULT 0,
    notes TEXT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS ${T.complaints} (
    id VARCHAR(64) PRIMARY KEY,
    seq INT NOT NULL AUTO_INCREMENT, UNIQUE KEY complaints_seq (seq),
    tenantId VARCHAR(64) NOT NULL DEFAULT '',
    tenantName VARCHAR(191) NOT NULL DEFAULT '',
    roomId VARCHAR(64) NOT NULL DEFAULT '',
    roomNumber VARCHAR(32) NOT NULL DEFAULT '',
    title TEXT NOT NULL,
    category VARCHAR(32) NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'Baru',
    priority VARCHAR(16) NOT NULL DEFAULT 'Sedang',
    date VARCHAR(32) NOT NULL DEFAULT '',
    description TEXT NOT NULL,
    repairCost INT NULL,
    notes TEXT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS ${T.settings} (
    id TINYINT PRIMARY KEY,
    data JSON NOT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
];

// Non-destructive ALTER TABLE migrations for existing installations.
// Each statement uses ADD COLUMN IF NOT EXISTS so running on fresh DB is also safe.
const MIGRATIONS = [
  // ── rooms ──
  `ALTER TABLE ${T.rooms} ADD COLUMN IF NOT EXISTS housekeepingStatus VARCHAR(32) NOT NULL DEFAULT 'Bersih'`,
  `ALTER TABLE ${T.rooms} ADD COLUMN IF NOT EXISTS pricePerDay INT NOT NULL DEFAULT 0`,
  `ALTER TABLE ${T.rooms} ADD COLUMN IF NOT EXISTS pricePerMonth INT NOT NULL DEFAULT 0`,
  `ALTER TABLE ${T.rooms} ADD COLUMN IF NOT EXISTS pricePerWeek INT NOT NULL DEFAULT 0`,
  `ALTER TABLE ${T.rooms} ADD COLUMN IF NOT EXISTS rentalTypesAllowed JSON`,
  `ALTER TABLE ${T.rooms} ADD COLUMN IF NOT EXISTS maxGuests INT NOT NULL DEFAULT 2`,
  `ALTER TABLE ${T.rooms} ADD COLUMN IF NOT EXISTS images JSON`,
  `ALTER TABLE ${T.rooms} ADD COLUMN IF NOT EXISTS description TEXT NULL`,
  // ── tenants ──
  `ALTER TABLE ${T.tenants} ADD COLUMN IF NOT EXISTS guestType VARCHAR(16) NOT NULL DEFAULT 'Bulanan'`,
  `ALTER TABLE ${T.tenants} ADD COLUMN IF NOT EXISTS checkInDate VARCHAR(32) NULL`,
  `ALTER TABLE ${T.tenants} ADD COLUMN IF NOT EXISTS checkOutDate VARCHAR(32) NULL`,
  `ALTER TABLE ${T.tenants} ADD COLUMN IF NOT EXISTS idType VARCHAR(16) NOT NULL DEFAULT 'KTP'`,
  `ALTER TABLE ${T.tenants} ADD COLUMN IF NOT EXISTS vehicleNumber VARCHAR(32) NULL`,
  `ALTER TABLE ${T.tenants} ADD COLUMN IF NOT EXISTS totalGuests INT NOT NULL DEFAULT 1`,
  `ALTER TABLE ${T.tenants} ADD COLUMN IF NOT EXISTS bookingOrigin VARCHAR(32) NOT NULL DEFAULT 'Walk-in'`,
  // ── bills ──
  `ALTER TABLE ${T.bills} ADD COLUMN IF NOT EXISTS rentalType VARCHAR(16) NOT NULL DEFAULT 'Bulanan'`,
  `ALTER TABLE ${T.bills} ADD COLUMN IF NOT EXISTS stayDuration INT NOT NULL DEFAULT 1`,
  `ALTER TABLE ${T.bills} ADD COLUMN IF NOT EXISTS checkInDate VARCHAR(32) NULL`,
  `ALTER TABLE ${T.bills} ADD COLUMN IF NOT EXISTS checkOutDate VARCHAR(32) NULL`,
];

async function initOnce() {
  const p = getPool();

  // 1. Ensure all tables exist (CREATE TABLE IF NOT EXISTS)
  for (const sql of SCHEMA) await p.query(sql);

  // 2. Run non-destructive migrations for existing installations
  for (const sql of MIGRATIONS) {
    try {
      await p.query(sql);
    } catch (err) {
      // MySQL 5.x doesn't support IF NOT EXISTS on ALTER; ignore duplicate column error (1060)
      if (err.errno !== 1060) throw err;
    }
  }

  // 3. Seed ONLY when all app tables are empty (first boot ever)
  let total = 0;
  for (const t of Object.values(T)) {
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
  console.log('✅ Database di-seed dengan data contoh StayFlow (database kosong).');
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
