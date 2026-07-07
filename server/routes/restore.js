import { Router } from 'express';
import { asyncHandler } from './helpers.js';
import { getPool, T } from '../db.js';
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
    for (const t of [T.bills, T.complaints, T.expenses, T.tenants, T.rooms]) {
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
