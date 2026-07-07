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
