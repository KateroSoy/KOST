# Plan-Based Menu Lock — Design Spec

**Date:** 2026-09-13
**Branch:** `stay`
**Status:** Approved for implementation

## 1. Purpose

Kostweb currently has no monetization gate: every registered owner gets full
access to every menu tab forever (`AuthController::register` hardcodes
`plan = 'pro'`, and nothing in the frontend or backend ever checks `plan`).
This spec defines a whole-tab, plan-based lock so that:

- New signups get a **7-day full-featured trial**, then drop to a **basic**
  tier unless upgraded.
- **Pro** tabs (the growth/scale features) require an active pro grant.
- **Basic** tabs (core day-to-day operation) stay open forever, free.

This is a product/business spec. It intentionally does **not** cover payment
processing or a self-serve upgrade flow — plan changes stay a manual
Super Admin action (`PATCH /api/admin/users/{id}/plan`, already built) until a
later phase.

## 2. Current State (as of this branch)

Menu tabs (`src/components/SidebarAndNav.tsx`) and their backend today:

| Tab (id) | Label | Backend today |
|---|---|---|
| dashboard | Beranda | client-side aggregation of rooms/tenants/bills |
| rooms | Unit Kamar | `RoomController` — full CRUD |
| bookings | Booking | `BookingController` — index/store/destroy only, **no status-update route** |
| tenants | Penghuni | `TenantController` — full CRUD + move-out |
| payments | Pembayaran | `BillController` — index/store/payments/destroy |
| operations | Operasional | `OperationTaskController` — index/store/destroy only, **no complete/status route** |
| website | Website | `WebsiteConfigController` — index/store (upsert) only, **no destroy** |
| reports | Laporan | **no backend at all** — `ReportsView` computes everything client-side from bills/expenses/tenants/rooms props |
| team | Tim | `StaffMemberController` — index/store/destroy only, **no role-update route** |
| settings | Pengaturan | `SettingController` — full |
| super_admin | Master SaaS | `SuperAdminController`, gated by `role === 'super_admin'` (unchanged by this spec) |

`users.plan` (`basic`\|`pro`, default `pro`) and `users.expires_at`
(nullable datetime) already exist in the schema
(`2026_08_11_000002_add_roles_and_subscription_to_users.php`) but
`expires_at` is currently unused by any code path.

The Bookings/Operations/Staff/Website-configs controllers are newly added on
this branch and are minimal CRUD stubs — filling their gaps (marked above) is
in scope for the implementation that follows this spec, since those are
exactly the tabs being pro-gated and need to work fully once unlocked.

## 3. Plan & Trial Model

- `users.plan`: the assigned tier, `'basic'` or `'pro'`.
- `users.expires_at`: when a `pro` grant expires. `NULL` = no expiry
  (permanent pro, or not on pro at all).
- **Effective plan** — computed at request/response time, never via a cron
  or stored mutation:

  ```
  effectivePlan(user) =
    if user.plan === 'pro' AND user.expires_at IS NOT NULL AND now() > user.expires_at
      -> 'basic'
    else
      -> user.plan
  ```

  Computing on read avoids depending on a scheduled job to flip the stored
  value — correct even if a cron never fires (shared/limited hosting).

- **Registration** (`AuthController::register`): sets `plan = 'pro'`,
  `expires_at = now() + 7 days`. Every new signup starts on a 7-day pro
  trial.
- **Super Admin `updatePlan`** (`SuperAdminController::updatePlan`,
  already built): when admin sets `plan = 'pro'`, clear `expires_at` to
  `NULL` (a manual grant is permanent until changed again — no trial
  countdown). When admin sets `plan = 'basic'`, also clear `expires_at`.
- **Existing rows**: untouched. Any user currently `plan = 'pro'` with
  `expires_at = NULL` stays permanently pro (grandfathered) — this spec
  changes behavior for new signups and future admin actions only, not
  retroactively for accounts that already exist.
- **Exposed fields**: `login`, `register`, `me`, and `admin/users` responses
  each add `effectivePlan` and `expiresAt` alongside the existing `plan`,
  so the frontend can render a trial countdown and know the true lock state
  without recomputing the rule itself.

## 4. Tab Lock Matrix

| Tier | Tabs |
|---|---|
| **Basic** (always open) | Beranda, Unit Kamar, Penghuni, Pembayaran, Pengaturan |
| **Pro** (locked on basic) | Booking, Website, Operasional, Tim, Laporan |
| **Role-gated** (unaffected by plan) | Master SaaS (`super_admin` role only) |

Rationale: basic covers the complete manual, single-operator workflow
(nothing feels broken or half-usable); pro is the "growing / has staff /
wants an online presence" tier. Booking pairs with Website (a public site
drives reservations); Operations pairs with Team (delegating work implies
staff); Reports is a standard premium analytics upsell.

## 5. Backend Enforcement

A new `RequirePlan` middleware (`app/Http/Middleware/RequirePlan.php`),
registered as route middleware `plan:pro`, computes the caller's effective
plan and aborts with `403` if it doesn't meet the requirement:

```json
{ "error": "Fitur ini memerlukan paket Pro.", "code": "PLAN_LOCKED", "requiredPlan": "pro" }
```

Applied to the full route groups for the five pro tabs in
`backend/routes/api.php`:

- `/bookings*` → `BookingController`
- `/operations*` → `OperationTaskController`
- `/staff*` → `StaffMemberController`
- `/website-configs*` → `WebsiteConfigController`
- `/reports` (**new** — see §6) → `ReportController`

`super_admin` users always pass `RequirePlan` regardless of their own
`plan` value (so platform admins are never locked out while managing the
SaaS).

## 6. Reports Needs a Real Backend Endpoint

Reports currently has no backend surface — it's computed client-side from
data (bills, expenses, tenants, rooms) that basic-tier users already have
full API access to via already-open endpoints. Locking the *frontend view*
alone wouldn't actually protect anything, since the raw data feeding it is
unrestricted.

Resolution: add `GET /api/reports` (`ReportController@index`) that performs
the aggregation server-side (financial summary, occupancy, income vs.
expense trend — mirroring what `ReportsView.tsx` currently computes
client-side) and gate it with `plan:pro`. `ReportsView` switches from
computing locally to calling this endpoint. This both closes a genuine
backend-completeness gap (reports had zero backend involvement) and gives
the Reports tab a real enforced lock instead of a cosmetic one.

## 7. Frontend UX

- Locked nav items (`SidebarAndNav.tsx`) stay **visible** with a lock badge
  — hiding them entirely would hide the upsell; showing what pro unlocks is
  itself the pitch. Clicking one opens an upgrade prompt instead of
  navigating to the view.
- A trial banner shows while `expiresAt` is set and in the future
  (e.g. "5 hari tersisa dari masa uji coba Pro"), and an expired-trial
  variant once `effectivePlan` has flipped to `basic`.
- If a locked API call somehow still fires (stale tab open across a
  downgrade), the frontend reads `code: 'PLAN_LOCKED'` from the 403 and
  shows the same upgrade prompt rather than a generic error.
- **No data loss on downgrade**: a downgraded account's existing bookings,
  website config, operations tasks, and staff rows are preserved in the DB
  untouched — they simply become inaccessible via the locked endpoints
  until the account is upgraded again.

## 8. Testing Plan

- Backend: feature tests for `RequirePlan` — basic user gets 403 on each
  pro route group, pro user (trial and permanent) gets 200, super_admin
  always passes, expired-trial user is treated as basic.
- Backend: unit test for the `effectivePlan` computation (no expiry, future
  expiry, past expiry, non-pro plan ignores expiry).
- Backend: `ReportController@index` returns aggregates matching what
  `ReportsView`'s current client-side computation produces, for a fixture
  dataset.
- Frontend: locked tabs render the lock badge and route to the upgrade
  prompt for a `basic`/expired-trial user; unlocked for `pro`; trial banner
  renders with correct day count.

## 9. Out of Scope (future phases)

- Payment processing / actual billing for a pro subscription.
- Self-serve upgrade flow (currently: Super Admin manually sets the plan).
- Per-seat staff limits, per-plan property count limits, or any
  feature-level (as opposed to whole-tab) gating.
- A scheduled job to notify users before trial expiry (email/WhatsApp) —
  the effective-plan computation itself needs no cron, but a *reminder*
  message would.
