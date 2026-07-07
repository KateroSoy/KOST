import express from 'express';
import dotenv from 'dotenv';
import { apiRouter } from './app.js';
import { ensureInit } from './db.js';

dotenv.config();

const app = express();
const port = process.env.API_PORT || 3001;

app.use('/api', apiRouter());

app.listen(port, () => {
  console.log(`🔌 API server (dev) berjalan di http://localhost:${port}`);
  ensureInit()
    .then(() => console.log('✅ Koneksi MySQL siap.'))
    .catch((err) => console.warn(`⚠️ MySQL belum terjangkau (${err.message}). Frontend akan fallback ke mode offline.`));
});
