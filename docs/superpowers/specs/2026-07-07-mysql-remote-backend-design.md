# KOSTOS Remote MySQL Backend — Design

Supersedes `2026-07-03-local-backend-design.md` (SQLite variant, never implemented).
The database is now a **remote MySQL** instance (Hostinger hPanel), configured via
environment variables. Everything else keeps the shape of the earlier spec and of the
hybrid frontend layer that already exists in `src/api.ts` / `App.tsx`.

## Goal

Implement the `/api/*` backend that the frontend already calls, backed by a remote MySQL
database. Must be easy to develop locally (Windows) and easy to deploy (Hostinger hPanel
"Setup Node.js App"). Both environments connect to the same remote MySQL via `.env`:

```
DB_HOST=<hostname MySQL dari hPanel>
DB_PORT=3306
DB_USER=...
DB_PASSWORD=...
DB_NAME=...
```

Out of scope: real authentication (login stays a client-side flag), multi-kost/multi-user
support, and changes to the existing hybrid/offline fallback behaviour in `src/api.ts`.

## Architecture

- **Backend**: Express serves a REST API under `/api/*`.
- **Database**: remote MySQL via `mysql2/promise` connection pool (new dependency).
  No ORM — plain SQL through prepared statements.
- **Layout**: new `server/` folder:
  - `server/db.js` — creates the pool from env vars, runs `CREATE TABLE IF NOT EXISTS`
    for all tables on boot, seeds sample data (mirrored from `src/data.ts`) only when the
    tables are empty. Restarts never re-seed or wipe data.
  - `server/routes/*.js` — one router per resource.
  - `server/app.js` — builds the Express app and mounts all routes; shared by dev and
    prod entry points.
  - `server/index.js` — dev entry point, API only, port 3001.
- **Dev workflow**: `npm run dev` runs both processes via `concurrently` (new
  devDependency): Vite on port 3000 (unchanged) + API on port 3001. `vite.config.ts`
  gets a `/api` proxy to 3001 so frontend code is identical in dev and prod.
- **Prod workflow**: existing `server.js` is extended to mount the API routes alongside
  serving `dist/` — one process, one port. Works both locally (`START.bat` /
  `npm run start`) and as a Hostinger Node.js App.
- **Config**: `.env` (gitignored) holds the five DB vars above plus optional `PORT`;
  a committed `.env.example` documents them.

## Data model

Tables mirror `src/types.ts` 1:1: `rooms`, `tenants`, `bills`, `expenses`, `complaints`,
`settings` (singleton row). IDs are the client-generated string IDs the app already uses
(`VARCHAR` primary keys). Nested fields (`facilities[]`, `emergencyContact`,
`bankAccounts[]`, `payments[]`, notification/settings sub-objects) are stored as `JSON`
columns and parsed/serialized in `server/db.js` helpers, so `types.ts` does not change
and rows map directly to the objects the UI expects.

## API surface

Exactly the endpoints the frontend already calls (`src/api.ts` + `syncToBackend` calls
in `App.tsx`):

- `GET /api/settings`, `PUT /api/settings`
- `GET/POST /api/rooms`, `PATCH/DELETE /api/rooms/:id`
- `GET/POST /api/tenants`, `DELETE /api/tenants/:id`, `POST /api/tenants/:id/move-out`
- `GET/POST /api/bills`, `DELETE /api/bills/:id`, `POST /api/bills/:id/payments`
- `GET/POST /api/expenses`, `DELETE /api/expenses/:id`
- `GET/POST /api/complaints`, `PATCH/DELETE /api/complaints/:id`

Server-side business rules (must match what `App.tsx` computes client-side, since the
hybrid layer applies mutations optimistically and syncs in the background):

- `POST /api/tenants/:id/move-out`: set tenant status to `Keluar`, clear `roomId`, flip
  their room to `Kosong`, delete their unpaid (`Belum Bayar`) bills.
- `POST /api/bills/:id/payments`: append the payment to the bill's `payments` JSON,
  recompute `amountPaid`; when it reaches the bill total, set status `Lunas`.
- `PATCH /api/complaints/:id` with status `Selesai` and a `repairCost`: also insert a
  matching expense row (mirrors the client-side rule).
- `POST` upserts (`INSERT ... ON DUPLICATE KEY UPDATE`) rather than failing on duplicate
  IDs, because the optimistic client may retry syncs.

## Error handling & resilience

- Each route wraps its logic in try/catch and returns `{ error: message }` with an
  appropriate status (500/503).
- The pool uses a short `connectTimeout` (~5s). If MySQL is unreachable, requests fail
  fast with 503 — the existing frontend fallback then switches to localStorage mode.
  The server itself always boots, even when the DB is down at startup (schema init
  retries lazily on first successful connection).

## Deployment

- Update `PANDUAN_DEPLOY_CPANEL.md` Method 2 (Node.js App) with: creating the MySQL DB
  in hPanel, enabling **Remote MySQL** (allow the connecting host or `%`), and filling
  `.env` on the server.
- Local Windows use: `START.bat` keeps working — `npm run build` + `npm run start`,
  reading the same `.env`.

## Testing / verification

- Automated: none added (project has no test infra); verification is behavioural.
- With a reachable MySQL (or local MySQL for dev): boot server, confirm tables created
  and seeded once; exercise every endpoint (create/patch/delete per resource, move-out,
  payments) via HTTP and confirm rows change in the DB and survive a server restart.
- With DB unreachable: confirm the server still boots, `/api/settings` returns 503
  quickly, and the frontend falls back to localStorage mode.
