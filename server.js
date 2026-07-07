import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { apiRouter } from './server/app.js';
import { ensureInit } from './server/db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use('/api', apiRouter());

// Serve static files from the Vite build directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle SPA routing - return index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`🚀 Production server is running on http://localhost:${port}`);
  ensureInit()
    .then(() => console.log('✅ Koneksi MySQL siap.'))
    .catch((err) => console.warn(`⚠️ MySQL belum terjangkau (${err.message}). Frontend akan fallback ke mode offline.`));
});
