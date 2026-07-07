import { ensureInit, getPool } from '../db.js';

const CONN_CODES = ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'EHOSTUNREACH', 'PROTOCOL_CONNECTION_LOST', 'ER_ACCESS_DENIED_ERROR'];

const isConnError = (err) => {
  if (!err) return false;
  if (CONN_CODES.includes(err.code)) return true;
  if ((err.message || '').toLowerCase().includes('connect')) return true;
  // Pool failures arrive as AggregateError with the real cause inside
  if (Array.isArray(err.errors)) return err.errors.some(isConnError);
  return false;
};

// Wraps a route: ensures the DB is initialized, catches errors,
// maps connection failures to 503 so the frontend flips to offline mode.
export const asyncHandler = (fn) => async (req, res) => {
  try {
    await ensureInit();
    await fn(req, res, getPool());
  } catch (err) {
    console.error(`[api] ${req.method} ${req.originalUrl}:`, err.message || err);
    const status = isConnError(err) ? 503 : 500;
    res.status(status).json({ error: err.message || 'Database tidak terjangkau' });
  }
};
