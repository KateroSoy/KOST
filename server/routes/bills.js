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
