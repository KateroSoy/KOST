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
