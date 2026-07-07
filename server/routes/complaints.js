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
