# KOSTOS Local Backend & Database — Design

## Goal

Replace `localStorage` as the source of truth for every existing menu (Rooms, Tenants,
Bills, Payments, Expenses, Complaints, Reports, Settings) with a real backend API backed
by a local SQLite database. The UI stays the same — only the data layer changes.

Out of scope: real authentication (login stays a client-side flag, as it is today) and
multi-kost/multi-user support.

## Architecture

- **Backend**: Express (already a dependency) serves a REST API under `/api/*`.
- **Database**: SQLite via `better-sqlite3`, stored at `./data/kostos.db` (gitignored).
  Chosen over a JSON-file store (lowdb) because it gives real relational queries for
  reports, and over Postgres/Docker because it needs zero server setup — fits "local db,
  easy and fast."
- **Dev workflow**: two processes run together via `concurrently` (new devDependency)
  under a single `npm run dev`:
  - Vite dev server on port 3000 (HMR, unchanged).
  - API server on port 3001 (new, `server/index.js`).
  `vite.config.ts` gets a `/api` proxy to port 3001, so frontend code calls
  `fetch('/api/...')` identically in dev and prod.
- **Prod workflow**: `server.js` is extended to mount the API routes alongside serving
  the built `dist/` — one process, one port, same as today's deployment shape.
- **First boot**: if `data/kostos.db` doesn't exist, the server creates the schema and
  seeds it with the current sample data from `src/data.ts`, so the app looks and behaves
  the same out of the box as it does today.

## Data model

Tables mirror the existing TypeScript types in `src/types.ts` directly: `rooms`,
`tenants`, `bills`, `expenses`, `complaints`, `settings` (singleton row). Nested fields
(`facilities[]`, `emergencyContact`, `bankAccounts[]`) are stored as JSON text columns
and parsed/serialized in the data-access layer, so `types.ts` does not need to change and
rows map 1:1 to the objects the UI already expects. No ORM — raw SQL via
`better-sqlite3` prepared statements, one small data-access module per resource under
`server/db/`.

## API surface

One Express router per resource under `server/routes/`:

- `GET/POST /api/rooms`, `PATCH/DELETE /api/rooms/:id`
- `GET/POST /api/tenants`, `DELETE /api/tenants/:id`, `POST /api/tenants/:id/move-out`
- `GET/POST /api/bills`, `DELETE /api/bills/:id`, `POST /api/bills/:id/payments`
- `GET/POST /api/expenses`, `DELETE /api/expenses/:id`
- `GET/POST /api/complaints`, `PATCH /api/complaints/:id`, `DELETE /api/complaints/:id`
- `GET/PUT /api/settings`, `POST /api/onboarding`
- `GET /api/backup`, `POST /api/restore` (JSON export/import, replacing the current
  in-memory backup/restore in Settings)

Cross-entity business rules currently hardcoded in `App.tsx` move server-side into these
routes, so they're enforced consistently:

- Adding a tenant auto-creates their first bill and flips the assigned room to `Terisi`.
- Moving a tenant out clears the room and drops their unpaid bills.
- Recording a payment that reaches the bill total flips the bill to `Lunas` and updates
  the tenant/room status.
- Resolving a complaint with a repair cost auto-logs a matching expense.

## Frontend integration

- New `src/api.ts`: thin `fetch` wrapper functions mirroring today's handler names
  (`getRooms`, `addRoom`, `updateRoomStatus`, `deleteRoom`, `addTenant`, `moveOutTenant`,
  `recordPayment`, etc.), each returning parsed JSON and throwing on non-2xx responses.
- `App.tsx`: the two `localStorage` `useEffect` blocks (load-on-mount, sync-on-change)
  are replaced by a single `Promise.all` fetch of all resources on mount. Each handler
  (`handleAddRoom`, `handleRecordPayment`, …) becomes `async`: it calls the API, then
  updates local state from the response, instead of hand-rolling the mutation in JS.
- Child view components (`RoomsView`, `TenantsView`, `BillsView`, …) are unchanged —
  they already receive data and callbacks as props.
- Login/auth is untouched — still a `localStorage` flag gating `authMode`.
- The existing backup/restore buttons in Settings now call `GET/POST /api/backup` instead
  of reading/writing in-memory state directly.
- API failures surface through a small reusable toast, generalized from the existing
  `backupMsg` toast pattern in `App.tsx`, instead of one-off per-feature error UI.

## Error handling

- Backend: each route wraps its logic in try/catch, returns `{ error: message }` with an
  appropriate HTTP status code on failure.
- Frontend: `src/api.ts` throws on non-2xx; callers catch and show the shared toast.
- DB file creation and seeding happens once, guarded by a check for the file's existence,
  so restarting the server never re-seeds or wipes existing data.

## Testing / verification

- Manual pass through every menu (create/update/delete in each of Rooms, Tenants, Bills,
  Payments, Expenses, Complaints, Settings) confirming data persists across a server
  restart — proof it's actually in the DB, not memory.
- Manual verification of the four cross-entity business rules listed above.
- No automated test suite exists in this project today; none is added as part of this
  change beyond what's useful for the trickiest business-rule routes, at the
  implementer's discretion during the planning phase.
