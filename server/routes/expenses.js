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
