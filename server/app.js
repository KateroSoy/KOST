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
