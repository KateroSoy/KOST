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
