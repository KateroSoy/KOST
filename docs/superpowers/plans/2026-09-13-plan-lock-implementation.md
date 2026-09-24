# Plan-Based Menu Lock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce a whole-tab, plan-based lock (7-day pro trial → basic) across backend routes and the frontend nav, and finish the CRUD gaps on the five newly pro-gated resources so they work fully once unlocked.

**Architecture:** Backend computes `effectivePlan` on read (never via cron) via a `User::effectivePlan()` method, enforced by a new `RequirePlan` middleware (`plan:pro`) applied to the five pro route groups (`bookings`, `operations`, `staff`, `website-configs`, the new `reports`). Frontend adds an `authUser` state in `App.tsx` (populated from `/api/auth/me`), renders lock badges on pro nav items, blocks navigation into locked tabs with an upgrade modal, and shows a trial-countdown banner. A new `ReportController` moves the Reports aggregation server-side so the lock is real, not cosmetic.

**Tech Stack:** Laravel 11 (PHP, Sanctum, PHPUnit/sqlite in-memory), React 19 + TypeScript + Vite, Tailwind, `@phosphor-icons/react`.

**Spec:** `docs/superpowers/specs/2026-09-13-plan-lock-design.md`

## Global Constraints

- Effective plan is **always computed on read** — no cron, no stored mutation of `plan` on expiry (spec §3).
- `RequirePlan` 403 body is exactly: `{ "error": "Fitur ini memerlukan paket Pro.", "code": "PLAN_LOCKED", "requiredPlan": "pro" }` (spec §5).
- `super_admin` always passes `RequirePlan` regardless of their own `plan` (spec §5).
- Registration grants a **7-day** pro trial: `plan = 'pro'`, `expires_at = now()->addDays(7)` (spec §3).
- Super Admin `updatePlan` clears `expires_at` to `NULL` on **both** `pro` and `basic` (spec §3) — a manual grant has no countdown.
- Existing rows (already `pro` with `expires_at = NULL`) are untouched — this only changes behavior for new signups and future admin actions (spec §3).
- `login`, `register`, `me`, and `admin/users` responses each add `effectivePlan` and `expiresAt` (spec §3).
- Locked nav items stay **visible** with a lock badge, not hidden (spec §7).
- No data loss on downgrade — locked resources are inaccessible, not deleted (spec §7, already true since nothing in this plan deletes data on plan change).
- There is no frontend component-test runner in this repo (`package.json` has no vitest/jest). Frontend tasks are verified with `npm run lint` (`tsc --noEmit`) plus a manual click-through in the browser — do not introduce a new test framework to satisfy this plan.

---

## File Structure

**Backend — new files:**
- `backend/app/Http/Middleware/RequirePlan.php` — the `plan:<tier>` gate.
- `backend/app/Http/Controllers/ReportController.php` — server-side Reports aggregation (closes the "Reports has no backend" gap from spec §6).
- `backend/tests/Unit/RequirePlanMiddlewareTest.php`
- `backend/tests/Unit/UserEffectivePlanTest.php`
- `backend/tests/Feature/ReportApiTest.php`
- `backend/tests/Feature/PlanGateApiTest.php`
- `backend/tests/Feature/BookingStatusApiTest.php`
- `backend/tests/Feature/OperationStatusApiTest.php`
- `backend/tests/Feature/StaffRoleApiTest.php`
- `backend/tests/Feature/WebsiteConfigDestroyApiTest.php`

**Backend — modified files:**
- `backend/app/Models/User.php` — add `effectivePlan()`.
- `backend/app/Http/Controllers/AuthController.php` — trial expiry on register, DRY `serializeUser()`, expose `effectivePlan`/`expiresAt`.
- `backend/app/Http/Controllers/SuperAdminController.php` — clear `expires_at` in `updatePlan`, expose `effectivePlan`/`expiresAt` in `users()`.
- `backend/app/Http/Controllers/BookingController.php` — add `updateStatus()`.
- `backend/app/Http/Controllers/OperationTaskController.php` — add `updateStatus()`.
- `backend/app/Http/Controllers/StaffMemberController.php` — add `updateRole()`.
- `backend/app/Http/Controllers/WebsiteConfigController.php` — add `destroy()`.
- `backend/bootstrap/app.php` — register the `plan` middleware alias.
- `backend/routes/api.php` — gate the five pro route groups with `plan:pro`; add the four new sub-routes; add `GET /reports`.

**Frontend — new files:**
- `src/components/UpgradePromptModal.tsx` — reused for both a locked-tab click and a stale-tab 403 (`PLAN_LOCKED`).
- `src/components/TrialBanner.tsx` — trial countdown / expired banner.

**Frontend — modified files:**
- `src/types.ts` — `AuthUser.effectivePlan`/`expiresAt`; `ReportsAggregate` type.
- `src/api.ts` — `authMe()`, `fetchReports()`, `setPlanLockedHandler()`, `AuthResult.user` fields, PLAN_LOCKED detection in `syncToBackend`/`fetchAllData`.
- `src/App.tsx` — `authUser` state, tab-lock guard, upgrade modal + trial banner wiring, booking/operation status handlers switched to the new PATCH routes.
- `src/components/SidebarAndNav.tsx` — `lockedTabIds` prop, lock badge rendering only (no click interception — `App.tsx` owns the gate).
- `src/components/ReportsView.tsx` — fetch aggregates from `/api/reports` instead of computing client-side.

---

## Task 1: `User::effectivePlan()` + trial expiry on registration

**Files:**
- Modify: `backend/app/Models/User.php`
- Modify: `backend/app/Http/Controllers/AuthController.php`
- Test: `backend/tests/Unit/UserEffectivePlanTest.php`
- Test: `backend/tests/Feature/AuthPlanFieldsTest.php` (new)

**Interfaces:**
- Produces: `User::effectivePlan(): string` — used by `RequirePlan` (Task 2), `SuperAdminController` (Task 3), `ReportController` (Task 4), and route gating (Task 5).
- Produces: `AuthController::serializeUser(User $user): array` returning `['id','name','phone','slug','role','status','plan','effectivePlan','expiresAt']`, consumed by `register`, `login`, `me`.

- [ ] **Step 1: Write the failing unit test**

```php
<?php
// backend/tests/Unit/UserEffectivePlanTest.php
namespace Tests\Unit;

use App\Models\User;
use Tests\TestCase;

class UserEffectivePlanTest extends TestCase
{
    public function test_pro_with_no_expiry_stays_pro()
    {
        $user = new User(['plan' => 'pro', 'expires_at' => null]);
        $this->assertEquals('pro', $user->effectivePlan());
    }

    public function test_pro_with_future_expiry_stays_pro()
    {
        $user = new User(['plan' => 'pro', 'expires_at' => now()->addDay()]);
        $this->assertEquals('pro', $user->effectivePlan());
    }

    public function test_pro_with_past_expiry_becomes_basic()
    {
        $user = new User(['plan' => 'pro', 'expires_at' => now()->subDay()]);
        $this->assertEquals('basic', $user->effectivePlan());
    }

    public function test_basic_plan_ignores_expiry()
    {
        $user = new User(['plan' => 'basic', 'expires_at' => now()->addDay()]);
        $this->assertEquals('basic', $user->effectivePlan());
    }
}
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd backend && php artisan test --filter=UserEffectivePlanTest`
Expected: FAIL — `Call to undefined method App\Models\User::effectivePlan()`

- [ ] **Step 3: Add `effectivePlan()` to the User model**

Modify `backend/app/Models/User.php` — add this method inside the class, after `isSuperAdmin()`:

```php
    /**
     * Effective plan right now: a 'pro' grant with a past expiry reads as 'basic'.
     * Computed on read — never mutates the stored `plan` column.
     */
    public function effectivePlan(): string
    {
        if ($this->plan === 'pro' && $this->expires_at !== null && now()->greaterThan($this->expires_at)) {
            return 'basic';
        }

        return $this->plan;
    }
```

- [ ] **Step 4: Run the unit test to verify it passes**

Run: `cd backend && php artisan test --filter=UserEffectivePlanTest`
Expected: PASS (4 tests)

- [ ] **Step 5: Write the failing feature test for registration + serialized fields**

```php
<?php
// backend/tests/Feature/AuthPlanFieldsTest.php
namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthPlanFieldsTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_grants_seven_day_pro_trial_and_exposes_plan_fields()
    {
        $response = $this->postJson('/api/auth/register', [
            'phone'    => '081200000001',
            'password' => 'secret123',
            'name'     => 'Trial User',
            'kostName' => 'Kost Trial',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['token', 'user' => ['id', 'plan', 'effectivePlan', 'expiresAt']])
            ->assertJsonPath('user.plan', 'pro')
            ->assertJsonPath('user.effectivePlan', 'pro');

        $user = User::where('phone', '081200000001')->first();
        $this->assertNotNull($user->expires_at);
        $this->assertTrue($user->expires_at->between(now()->addDays(6), now()->addDays(8)));
    }

    public function test_login_and_me_expose_plan_fields()
    {
        $user = User::create([
            'name' => 'Login User', 'phone' => '081200000002',
            'password' => bcrypt('secret123'), 'role' => 'owner', 'status' => 'active',
            'plan' => 'pro', 'expires_at' => now()->subDay(), 'slug' => 'login-user',
        ]);

        $login = $this->postJson('/api/auth/login', ['phone' => '081200000002', 'password' => 'secret123']);
        $login->assertOk()->assertJsonPath('user.effectivePlan', 'basic');

        $me = $this->actingAs($user, 'sanctum')->getJson('/api/auth/me');
        $me->assertOk()->assertJsonPath('effectivePlan', 'basic')->assertJsonPath('plan', 'pro');
    }
}
```

- [ ] **Step 6: Run it to verify it fails**

Run: `cd backend && php artisan test --filter=AuthPlanFieldsTest`
Expected: FAIL — register still sets no `expires_at`; `effectivePlan`/`expiresAt` missing from JSON.

- [ ] **Step 7: Implement — trial expiry + DRY serializer in `AuthController`**

Modify `backend/app/Http/Controllers/AuthController.php`. Add this private method right after `uniqueSlug()`:

```php
    /**
     * Common auth-facing user shape shared by register/login/me.
     */
    private function serializeUser(User $user): array
    {
        return [
            'id'            => $user->id,
            'name'          => $user->name,
            'phone'         => $user->phone,
            'slug'          => $user->slug,
            'role'          => $user->role ?? 'owner',
            'status'        => $user->status ?? 'active',
            'plan'          => $user->plan ?? 'pro',
            'effectivePlan' => $user->effectivePlan(),
            'expiresAt'     => optional($user->expires_at)->toIso8601String(),
        ];
    }
```

In `register()`, change the `User::create([...])` call to add the trial expiry:

```php
        $user = User::create([
            'name'       => $request->name,
            'phone'      => $request->phone,
            'slug'       => $slug,
            'role'       => 'owner',
            'status'     => 'active',
            'plan'       => 'pro',
            'expires_at' => now()->addDays(7),
            'email'      => $request->email ?? null,
            'password'   => Hash::make($request->password),
        ]);
```

Replace the `return response()->json([...])` block at the end of `register()` with:

```php
        return response()->json([
            'token' => $token,
            'user'  => $this->serializeUser($user),
        ], 201);
```

Replace the equivalent return block at the end of `login()` with:

```php
        return response()->json([
            'token' => $token,
            'user'  => $this->serializeUser($user),
        ]);
```

Replace the body of `me()` with:

```php
    public function me(Request $request)
    {
        $user = $request->user();
        return response()->json(array_merge($this->serializeUser($user), [
            'email' => $user->email,
        ]));
    }
```

- [ ] **Step 8: Run the feature test to verify it passes**

Run: `cd backend && php artisan test --filter=AuthPlanFieldsTest`
Expected: PASS (2 tests)

- [ ] **Step 9: Run the full backend suite to check for regressions**

Run: `cd backend && php artisan test`
Expected: all tests PASS (existing `StayFlowApiTest`/`SuperAdminApiTest` assert on `name`/`status`/`plan` fields already present in the new shape, so no breakage expected)

- [ ] **Step 10: Commit**

```bash
git add backend/app/Models/User.php backend/app/Http/Controllers/AuthController.php backend/tests/Unit/UserEffectivePlanTest.php backend/tests/Feature/AuthPlanFieldsTest.php
git commit -m "feat(backend): compute effective plan and grant 7-day pro trial on register"
```

---

## Task 2: `RequirePlan` middleware

**Files:**
- Create: `backend/app/Http/Middleware/RequirePlan.php`
- Modify: `backend/bootstrap/app.php`
- Test: `backend/tests/Unit/RequirePlanMiddlewareTest.php`

**Interfaces:**
- Consumes: `User::effectivePlan(): string` (Task 1).
- Produces: middleware alias `plan:<tier>` registered in `bootstrap/app.php`, consumed by route gating in Tasks 4 and 5.

- [ ] **Step 1: Write the failing unit test (no HTTP layer — call `handle()` directly)**

```php
<?php
// backend/tests/Unit/RequirePlanMiddlewareTest.php
namespace Tests\Unit;

use App\Http\Middleware\RequirePlan;
use App\Models\User;
use Illuminate\Http\Request;
use Tests\TestCase;

class RequirePlanMiddlewareTest extends TestCase
{
    private function callMiddleware(User $user, string $requiredPlan = 'pro')
    {
        $request = Request::create('/api/_test', 'GET');
        $request->setUserResolver(fn () => $user);

        $middleware = new RequirePlan();
        return $middleware->handle($request, fn ($req) => response()->json(['ok' => true]), $requiredPlan);
    }

    public function test_basic_user_is_blocked_with_plan_locked_body()
    {
        $user = new User(['plan' => 'basic', 'expires_at' => null, 'role' => 'owner']);
        $response = $this->callMiddleware($user);

        $this->assertEquals(403, $response->getStatusCode());
        $body = json_decode($response->getContent(), true);
        $this->assertEquals('PLAN_LOCKED', $body['code']);
        $this->assertEquals('pro', $body['requiredPlan']);
    }

    public function test_permanent_pro_user_passes()
    {
        $user = new User(['plan' => 'pro', 'expires_at' => null, 'role' => 'owner']);
        $response = $this->callMiddleware($user);
        $this->assertEquals(200, $response->getStatusCode());
    }

    public function test_trial_pro_user_within_window_passes()
    {
        $user = new User(['plan' => 'pro', 'expires_at' => now()->addDays(3), 'role' => 'owner']);
        $response = $this->callMiddleware($user);
        $this->assertEquals(200, $response->getStatusCode());
    }

    public function test_expired_trial_user_is_treated_as_basic_and_blocked()
    {
        $user = new User(['plan' => 'pro', 'expires_at' => now()->subDay(), 'role' => 'owner']);
        $response = $this->callMiddleware($user);
        $this->assertEquals(403, $response->getStatusCode());
    }

    public function test_super_admin_always_passes_regardless_of_plan()
    {
        $user = new User(['plan' => 'basic', 'expires_at' => null, 'role' => 'super_admin']);
        $response = $this->callMiddleware($user);
        $this->assertEquals(200, $response->getStatusCode());
    }
}
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd backend && php artisan test --filter=RequirePlanMiddlewareTest`
Expected: FAIL — `Class "App\Http\Middleware\RequirePlan" not found`

- [ ] **Step 3: Create the middleware**

```php
<?php
// backend/app/Http/Middleware/RequirePlan.php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequirePlan
{
    public function handle(Request $request, Closure $next, string $requiredPlan): Response
    {
        $user = $request->user();

        if ($user && ($user->role ?? 'owner') !== 'super_admin' && $user->effectivePlan() !== $requiredPlan) {
            return response()->json([
                'error'        => 'Fitur ini memerlukan paket Pro.',
                'code'         => 'PLAN_LOCKED',
                'requiredPlan' => $requiredPlan,
            ], 403);
        }

        return $next($request);
    }
}
```

- [ ] **Step 4: Register the `plan` middleware alias**

Modify `backend/bootstrap/app.php`:

```php
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->api(prepend: [
            ForceJsonResponse::class,
        ]);
        $middleware->alias([
            'plan' => \App\Http\Middleware\RequirePlan::class,
        ]);
    })
```

- [ ] **Step 5: Run the unit test to verify it passes**

Run: `cd backend && php artisan test --filter=RequirePlanMiddlewareTest`
Expected: PASS (5 tests)

- [ ] **Step 6: Commit**

```bash
git add backend/app/Http/Middleware/RequirePlan.php backend/bootstrap/app.php backend/tests/Unit/RequirePlanMiddlewareTest.php
git commit -m "feat(backend): add RequirePlan middleware for whole-tab plan gating"
```

---

## Task 3: Super Admin plan updates clear `expires_at` + expose plan fields on `users()`

**Files:**
- Modify: `backend/app/Http/Controllers/SuperAdminController.php`
- Test: `backend/tests/Feature/SuperAdminApiTest.php` (extend existing file)

**Interfaces:**
- Consumes: `User::effectivePlan()` (Task 1).

- [ ] **Step 1: Write the failing tests (append to the existing test class)**

Add to `backend/tests/Feature/SuperAdminApiTest.php`, inside the class body:

```php
    public function test_super_admin_setting_plan_clears_expires_at()
    {
        $this->owner->plan = 'pro';
        $this->owner->expires_at = now()->addDays(3);
        $this->owner->save();

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->patchJson("/api/admin/users/{$this->owner->id}/plan", ['plan' => 'pro']);

        $response->assertStatus(200)->assertJsonPath('effectivePlan', 'pro');
        $this->assertNull($this->owner->fresh()->expires_at);
    }

    public function test_super_admin_setting_basic_plan_also_clears_expires_at()
    {
        $this->owner->plan = 'pro';
        $this->owner->expires_at = now()->addDays(3);
        $this->owner->save();

        $this->actingAs($this->superAdmin, 'sanctum')
            ->patchJson("/api/admin/users/{$this->owner->id}/plan", ['plan' => 'basic'])
            ->assertStatus(200);

        $fresh = $this->owner->fresh();
        $this->assertEquals('basic', $fresh->plan);
        $this->assertNull($fresh->expires_at);
    }

    public function test_users_listing_exposes_effective_plan_and_expiry()
    {
        $this->owner->plan = 'pro';
        $this->owner->expires_at = now()->subDay();
        $this->owner->save();

        $response = $this->actingAs($this->superAdmin, 'sanctum')->getJson('/api/admin/users');

        $response->assertStatus(200);
        $this->assertEquals('basic', $response->json()[0]['effectivePlan']);
        $this->assertNotNull($response->json()[0]['expiresAt']);
    }
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd backend && php artisan test --filter=SuperAdminApiTest`
Expected: FAIL — `expires_at` untouched; `effectivePlan`/`expiresAt` missing from `users()` JSON.

- [ ] **Step 3: Implement**

In `backend/app/Http/Controllers/SuperAdminController.php`, replace the body of `updatePlan()` from `$user->plan = $request->plan;` through the `save()`/return with:

```php
        $user->plan = $request->plan;
        $user->expires_at = null;
        $user->save();

        return response()->json([
            'ok'            => true,
            'plan'          => $user->plan,
            'effectivePlan' => $user->effectivePlan(),
            'expiresAt'     => optional($user->expires_at)->toIso8601String(),
        ]);
```

In `users()`, in the `$users->map(...)` closure's returned array, add two keys right after `'plan' => $u->plan ?? 'pro',`:

```php
                'plan'          => $u->plan ?? 'pro',
                'effectivePlan' => $u->effectivePlan(),
                'expiresAt'     => optional($u->expires_at)->toIso8601String(),
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd backend && php artisan test --filter=SuperAdminApiTest`
Expected: PASS (all tests in the file, including the 3 new ones)

- [ ] **Step 5: Commit**

```bash
git add backend/app/Http/Controllers/SuperAdminController.php backend/tests/Feature/SuperAdminApiTest.php
git commit -m "feat(backend): clear expires_at on manual plan grants, expose plan fields in admin/users"
```

---

## Task 4: `ReportController` — server-side Reports aggregation, gated `pro`

**Files:**
- Create: `backend/app/Http/Controllers/ReportController.php`
- Modify: `backend/routes/api.php`
- Test: `backend/tests/Feature/ReportApiTest.php`

**Interfaces:**
- Consumes: `Bill` (`user_id`, `period`, `dueDate`, `paymentDate`, `status`, `paidAmount`, `totalAmount`, `roomNumber`, `tenantName`, `paymentMethod`), `Expense` (`user_id`, `date`, `amount`), `Room` (`user_id`, `status`) — all existing models, no schema changes.
- Produces: `GET /api/reports?mode=month&month=Juni+2026` (or `mode=range&startDate=...&endDate=...`) → JSON `{ totalRevenue, totalCosts, actualProfit, outstandingAmount, paidBillsCount, unpaidBillsCount, occupancyRate, roomStatusCounts: {terisi,kosong,perbaikan}, trend: [{name,income,expense}], unpaidBills: [{id,roomNumber,tenantName,paymentMethod,status,remaining}] }`. Consumed by frontend Task 13 (`fetchReports`).

- [ ] **Step 1: Write the failing feature test with a fixture dataset**

```php
<?php
// backend/tests/Feature/ReportApiTest.php
namespace Tests\Feature;

use App\Models\Bill;
use App\Models\Expense;
use App\Models\Room;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $pro;
    protected User $basic;

    protected function setUp(): void
    {
        parent::setUp();

        $this->pro = User::create([
            'name' => 'Pro Owner', 'phone' => '081300000001', 'password' => bcrypt('secret123'),
            'role' => 'owner', 'status' => 'active', 'plan' => 'pro', 'slug' => 'pro-owner',
        ]);

        $this->basic = User::create([
            'name' => 'Basic Owner', 'phone' => '081300000002', 'password' => bcrypt('secret123'),
            'role' => 'owner', 'status' => 'active', 'plan' => 'basic', 'slug' => 'basic-owner',
        ]);

        Room::create(['id' => 'r1', 'user_id' => $this->pro->id, 'number' => '101', 'status' => 'Terisi', 'type' => 'Standard', 'price' => 1000000, 'floor' => 1, 'size' => '3x3', 'facilities' => []]);
        Room::create(['id' => 'r2', 'user_id' => $this->pro->id, 'number' => '102', 'status' => 'Kosong', 'type' => 'Standard', 'price' => 1000000, 'floor' => 1, 'size' => '3x3', 'facilities' => []]);

        Bill::create([
            'id' => 'b1', 'user_id' => $this->pro->id, 'tenantId' => 't1', 'tenantName' => 'Andi',
            'roomId' => 'r1', 'roomNumber' => '101', 'period' => 'Juni 2026', 'dueDate' => '2026-06-05',
            'rentAmount' => 1000000, 'electricityCharge' => 0, 'waterCharge' => 0, 'additionalFee' => 0,
            'discount' => 0, 'lateFee' => 0, 'totalAmount' => 1000000, 'paidAmount' => 1000000,
            'status' => 'Lunas', 'paymentMethod' => 'Transfer', 'paymentDate' => '2026-06-04',
        ]);
        Bill::create([
            'id' => 'b2', 'user_id' => $this->pro->id, 'tenantId' => 't2', 'tenantName' => 'Budi',
            'roomId' => 'r2', 'roomNumber' => '102', 'period' => 'Juni 2026', 'dueDate' => '2026-06-05',
            'rentAmount' => 1000000, 'electricityCharge' => 0, 'waterCharge' => 0, 'additionalFee' => 0,
            'discount' => 0, 'lateFee' => 0, 'totalAmount' => 1000000, 'paidAmount' => 400000,
            'status' => 'Sebagian',
        ]);

        Expense::create(['id' => 'e1', 'user_id' => $this->pro->id, 'category' => 'Listrik', 'description' => 'PLN', 'date' => '2026-06-10', 'amount' => 300000]);
    }

    public function test_basic_user_is_blocked()
    {
        $this->actingAs($this->basic, 'sanctum')
            ->getJson('/api/reports?mode=month&month=Juni+2026')
            ->assertStatus(403)
            ->assertJsonPath('code', 'PLAN_LOCKED');
    }

    public function test_pro_user_gets_month_aggregate_matching_expected_totals()
    {
        $response = $this->actingAs($this->pro, 'sanctum')
            ->getJson('/api/reports?mode=month&month=Juni+2026');

        $response->assertStatus(200)
            ->assertJsonPath('totalRevenue', 1400000.0)
            ->assertJsonPath('totalCosts', 300000.0)
            ->assertJsonPath('actualProfit', 1100000.0)
            ->assertJsonPath('outstandingAmount', 600000.0)
            ->assertJsonPath('paidBillsCount', 1)
            ->assertJsonPath('unpaidBillsCount', 1)
            ->assertJsonPath('occupancyRate', 50.0)
            ->assertJsonPath('roomStatusCounts.terisi', 1)
            ->assertJsonPath('roomStatusCounts.kosong', 1)
            ->assertJsonCount(1, 'unpaidBills');

        $this->assertEquals('102', $response->json('unpaidBills.0.roomNumber'));
        $this->assertEquals(600000.0, $response->json('unpaidBills.0.remaining'));
    }

    public function test_pro_user_gets_range_aggregate()
    {
        $response = $this->actingAs($this->pro, 'sanctum')
            ->getJson('/api/reports?mode=range&startDate=2026-06-01&endDate=2026-06-30');

        $response->assertStatus(200)
            ->assertJsonPath('totalRevenue', 1400000.0)
            ->assertJsonPath('totalCosts', 300000.0);
    }
}
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd backend && php artisan test --filter=ReportApiTest`
Expected: FAIL — route `/api/reports` does not exist (404)

- [ ] **Step 3: Create `ReportController`**

```php
<?php
// backend/app/Http/Controllers/ReportController.php
namespace App\Http\Controllers;

use App\Models\Bill;
use App\Models\Expense;
use App\Models\Room;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    private const MONTHS = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ];

    private function monthKey(string $month): string
    {
        $parts = explode(' ', $month);
        $index = array_search($parts[0], self::MONTHS, true);
        $monthNum = $index === false ? '06' : str_pad((string) ($index + 1), 2, '0', STR_PAD_LEFT);
        $year = $parts[1] ?? '2026';
        return "{$year}-{$monthNum}";
    }

    private function trendMonths(string $selectedMonth): array
    {
        $parts = explode(' ', $selectedMonth);
        $baseIndex = array_search($parts[0], self::MONTHS, true);
        $baseYear = (int) ($parts[1] ?? 2026);

        if ($baseIndex === false) {
            return [$selectedMonth];
        }

        $result = [];
        for ($i = -1; $i <= 1; $i++) {
            $mi = $baseIndex + $i;
            $yr = $baseYear;
            if ($mi < 0) { $mi = 11; $yr--; }
            if ($mi > 11) { $mi = 0; $yr++; }
            $result[] = self::MONTHS[$mi] . ' ' . $yr;
        }
        return $result;
    }

    public function index(Request $request)
    {
        $userId = $request->user()->id;
        $mode = $request->query('mode', 'month');
        $selectedMonth = $request->query('month', self::MONTHS[5] . ' 2026');
        $startDate = $request->query('startDate');
        $endDate = $request->query('endDate');

        $allBills = Bill::where('user_id', $userId)->get();
        $allExpenses = Expense::where('user_id', $userId)->get();
        $rooms = Room::where('user_id', $userId)->get();

        if ($mode === 'range' && $startDate && $endDate) {
            $activeBills = $allBills->filter(function ($b) use ($startDate, $endDate) {
                $date = $b->paymentDate ?: $b->dueDate;
                return $date >= $startDate && $date <= $endDate;
            });
            $activeExpenses = $allExpenses->filter(fn ($e) => $e->date >= $startDate && $e->date <= $endDate);
        } else {
            $activeBills = $allBills->where('period', $selectedMonth);
            $activeMonthKey = $this->monthKey($selectedMonth);
            $activeExpenses = $allExpenses->filter(fn ($e) => str_starts_with($e->date, $activeMonthKey));
        }

        $totalRevenue = (float) $activeBills->whereIn('status', ['Lunas', 'Sebagian'])->sum('paidAmount');
        $totalCosts = (float) $activeExpenses->sum('amount');
        $outstandingAmount = (float) $activeBills->sum(fn ($b) => $b->totalAmount - $b->paidAmount);

        $paidBillsCount = $activeBills->where('status', 'Lunas')->count();
        $unpaidBillsCount = $activeBills->where('status', '!=', 'Lunas')->count();

        $occupancyRate = $rooms->count() > 0
            ? ($rooms->whereIn('status', ['Terisi', 'Menunggak'])->count() / $rooms->count()) * 100
            : 0;

        $trend = collect($this->trendMonths($selectedMonth))->map(function ($m) use ($allBills, $allExpenses) {
            $mKey = $this->monthKey($m);
            $mBills = $allBills->where('period', $m);
            $mExpenses = $allExpenses->filter(fn ($e) => str_starts_with($e->date, $mKey));

            return [
                'name'    => explode(' ', $m)[0],
                'income'  => (float) $mBills->whereIn('status', ['Lunas', 'Sebagian'])->sum('paidAmount'),
                'expense' => (float) $mExpenses->sum('amount'),
            ];
        })->values();

        $unpaidBills = $activeBills->where('status', '!=', 'Lunas')->map(fn ($b) => [
            'id'            => $b->id,
            'roomNumber'    => $b->roomNumber,
            'tenantName'    => $b->tenantName,
            'paymentMethod' => $b->paymentMethod,
            'status'        => $b->status,
            'remaining'     => (float) ($b->totalAmount - $b->paidAmount),
        ])->values();

        return response()->json([
            'totalRevenue'      => $totalRevenue,
            'totalCosts'        => $totalCosts,
            'actualProfit'      => $totalRevenue - $totalCosts,
            'outstandingAmount' => $outstandingAmount,
            'paidBillsCount'    => $paidBillsCount,
            'unpaidBillsCount'  => $unpaidBillsCount,
            'occupancyRate'     => round($occupancyRate, 2),
            'roomStatusCounts'  => [
                'terisi'    => $rooms->whereIn('status', ['Terisi', 'Menunggak'])->count(),
                'kosong'    => $rooms->where('status', 'Kosong')->count(),
                'perbaikan' => $rooms->where('status', 'Perbaikan')->count(),
            ],
            'trend'       => $trend,
            'unpaidBills' => $unpaidBills,
        ]);
    }
}
```

- [ ] **Step 4: Add the gated route**

Modify `backend/routes/api.php` — add the import at the top with the other controller imports:

```php
use App\Http\Controllers\ReportController;
```

Add this new group right after the `// Restore` block, still inside the `auth:sanctum` group, before its closing `});`:

```php
    // Reports (Pro tier)
    Route::middleware('plan:pro')->group(function () {
        Route::get('/reports', [ReportController::class, 'index']);
    });
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd backend && php artisan test --filter=ReportApiTest`
Expected: PASS (3 tests)

- [ ] **Step 6: Commit**

```bash
git add backend/app/Http/Controllers/ReportController.php backend/routes/api.php backend/tests/Feature/ReportApiTest.php
git commit -m "feat(backend): add server-side Reports aggregation endpoint, gated pro"
```

---

## Task 5: Gate bookings/operations/staff/website-configs with `plan:pro`

**Files:**
- Modify: `backend/routes/api.php`
- Test: `backend/tests/Feature/PlanGateApiTest.php`

**Interfaces:**
- Consumes: `plan:pro` alias (Task 2).

- [ ] **Step 1: Write the failing feature test**

```php
<?php
// backend/tests/Feature/PlanGateApiTest.php
namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PlanGateApiTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(string $plan, ?string $role = 'owner', $expiresAt = null): User
    {
        static $seq = 0;
        $seq++;
        return User::create([
            'name' => "User $seq", 'phone' => "08130000{$seq}0", 'password' => bcrypt('secret123'),
            'role' => $role, 'status' => 'active', 'plan' => $plan, 'expires_at' => $expiresAt,
            'slug' => "user-$seq",
        ]);
    }

    public static function proRouteProvider(): array
    {
        return [
            'bookings'        => ['/api/bookings'],
            'operations'      => ['/api/operations'],
            'staff'           => ['/api/staff'],
            'website-configs' => ['/api/website-configs'],
        ];
    }

    /** @dataProvider proRouteProvider */
    public function test_basic_user_gets_403_on_pro_route($route)
    {
        $user = $this->makeUser('basic');
        $this->actingAs($user, 'sanctum')->getJson($route)
            ->assertStatus(403)->assertJsonPath('code', 'PLAN_LOCKED');
    }

    /** @dataProvider proRouteProvider */
    public function test_pro_user_gets_200_on_pro_route($route)
    {
        $user = $this->makeUser('pro');
        $this->actingAs($user, 'sanctum')->getJson($route)->assertStatus(200);
    }

    /** @dataProvider proRouteProvider */
    public function test_expired_trial_user_gets_403_on_pro_route($route)
    {
        $user = $this->makeUser('pro', 'owner', now()->subDay());
        $this->actingAs($user, 'sanctum')->getJson($route)
            ->assertStatus(403)->assertJsonPath('code', 'PLAN_LOCKED');
    }

    /** @dataProvider proRouteProvider */
    public function test_super_admin_gets_200_on_pro_route_regardless_of_plan($route)
    {
        $user = $this->makeUser('basic', 'super_admin');
        $this->actingAs($user, 'sanctum')->getJson($route)->assertStatus(200);
    }
}
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd backend && php artisan test --filter=PlanGateApiTest`
Expected: FAIL — all `basic`/expired-trial cases currently return 200 (ungated), so the 403 assertions fail.

- [ ] **Step 3: Wrap the four route groups in `plan:pro`**

Modify `backend/routes/api.php` — replace the four existing blocks (Bookings, Operations, Staff, Website Configs) with a single wrapped group. Find:

```php
    // Bookings
    Route::get('/bookings',            [\App\Http\Controllers\BookingController::class, 'index']);
    Route::post('/bookings',           [\App\Http\Controllers\BookingController::class, 'store']);
    Route::delete('/bookings/{id}',    [\App\Http\Controllers\BookingController::class, 'destroy']);

    // Operations
    Route::get('/operations',          [\App\Http\Controllers\OperationTaskController::class, 'index']);
    Route::post('/operations',         [\App\Http\Controllers\OperationTaskController::class, 'store']);
    Route::delete('/operations/{id}',  [\App\Http\Controllers\OperationTaskController::class, 'destroy']);

    // Staff
    Route::get('/staff',               [\App\Http\Controllers\StaffMemberController::class, 'index']);
    Route::post('/staff',              [\App\Http\Controllers\StaffMemberController::class, 'store']);
    Route::delete('/staff/{id}',       [\App\Http\Controllers\StaffMemberController::class, 'destroy']);

    // Website Configs
    Route::get('/website-configs',     [\App\Http\Controllers\WebsiteConfigController::class, 'index']);
    Route::post('/website-configs',    [\App\Http\Controllers\WebsiteConfigController::class, 'store']);
```

Replace with:

```php
    // Bookings, Operations, Staff, Website Configs (Pro tier)
    Route::middleware('plan:pro')->group(function () {
        // Bookings
        Route::get('/bookings',            [\App\Http\Controllers\BookingController::class, 'index']);
        Route::post('/bookings',           [\App\Http\Controllers\BookingController::class, 'store']);
        Route::delete('/bookings/{id}',    [\App\Http\Controllers\BookingController::class, 'destroy']);

        // Operations
        Route::get('/operations',          [\App\Http\Controllers\OperationTaskController::class, 'index']);
        Route::post('/operations',         [\App\Http\Controllers\OperationTaskController::class, 'store']);
        Route::delete('/operations/{id}',  [\App\Http\Controllers\OperationTaskController::class, 'destroy']);

        // Staff
        Route::get('/staff',               [\App\Http\Controllers\StaffMemberController::class, 'index']);
        Route::post('/staff',              [\App\Http\Controllers\StaffMemberController::class, 'store']);
        Route::delete('/staff/{id}',       [\App\Http\Controllers\StaffMemberController::class, 'destroy']);

        // Website Configs
        Route::get('/website-configs',     [\App\Http\Controllers\WebsiteConfigController::class, 'index']);
        Route::post('/website-configs',    [\App\Http\Controllers\WebsiteConfigController::class, 'store']);
    });
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd backend && php artisan test --filter=PlanGateApiTest`
Expected: PASS (16 tests: 4 routes × 4 scenarios)

- [ ] **Step 5: Run the full backend suite**

Run: `cd backend && php artisan test`
Expected: all PASS — no other test hits these routes as a `basic` user, so no regressions.

- [ ] **Step 6: Commit**

```bash
git add backend/routes/api.php backend/tests/Feature/PlanGateApiTest.php
git commit -m "feat(backend): gate bookings/operations/staff/website-configs behind plan:pro"
```

---

## Task 6: Fill CRUD gaps on the newly pro-gated resources

**Files:**
- Modify: `backend/app/Http/Controllers/BookingController.php`
- Modify: `backend/app/Http/Controllers/OperationTaskController.php`
- Modify: `backend/app/Http/Controllers/StaffMemberController.php`
- Modify: `backend/app/Http/Controllers/WebsiteConfigController.php`
- Modify: `backend/routes/api.php`
- Modify: `src/App.tsx` (booking/operation status handlers switch to the new PATCH routes)
- Test: `backend/tests/Feature/BookingStatusApiTest.php`
- Test: `backend/tests/Feature/OperationStatusApiTest.php`
- Test: `backend/tests/Feature/StaffRoleApiTest.php`
- Test: `backend/tests/Feature/WebsiteConfigDestroyApiTest.php`

**Interfaces:**
- Produces: `PATCH /bookings/{id}/status` (body `{status}`), `PATCH /operations/{id}/status` (body `{status}`), `PATCH /staff/{id}/role` (body `{role}`), `DELETE /website-configs/{propertyId}`.

- [ ] **Step 1: Write the failing tests**

```php
<?php
// backend/tests/Feature/BookingStatusApiTest.php
namespace Tests\Feature;

use App\Models\Booking;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookingStatusApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_update_booking_status()
    {
        $user = User::create(['name' => 'Owner', 'phone' => '081400000001', 'password' => bcrypt('secret123'), 'role' => 'owner', 'status' => 'active', 'plan' => 'pro', 'slug' => 'owner-bk']);
        $booking = Booking::create(['user_id' => $user->id, 'custom_id' => 'bk1', 'property_id' => 'prop-1', 'room_type' => 'Standard', 'guest_name' => 'Andi', 'guest_phone' => '0812', 'move_in_date' => '2026-06-01', 'duration_months' => 1, 'guests_count' => 1, 'total_amount' => 1000000, 'deposit_amount' => 0, 'source' => 'Website', 'status' => 'Pending']);

        $this->actingAs($user, 'sanctum')
            ->patchJson('/api/bookings/bk1/status', ['status' => 'Confirmed'])
            ->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertEquals('Confirmed', $booking->fresh()->status);
    }
}
```

```php
<?php
// backend/tests/Feature/OperationStatusApiTest.php
namespace Tests\Feature;

use App\Models\OperationTask;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OperationStatusApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_update_task_status()
    {
        $user = User::create(['name' => 'Owner', 'phone' => '081400000002', 'password' => bcrypt('secret123'), 'role' => 'owner', 'status' => 'active', 'plan' => 'pro', 'slug' => 'owner-op']);
        $task = OperationTask::create(['user_id' => $user->id, 'custom_id' => 'op1', 'property_id' => 'prop-1', 'type' => 'Maintenance', 'title' => 'AC bocor', 'room_number' => '101', 'priority' => 'Tinggi', 'status' => 'Open', 'assigned_to' => 'Staff A', 'estimated_cost' => 0]);

        $this->actingAs($user, 'sanctum')
            ->patchJson('/api/operations/op1/status', ['status' => 'Completed'])
            ->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertEquals('Completed', $task->fresh()->status);
    }
}
```

```php
<?php
// backend/tests/Feature/StaffRoleApiTest.php
namespace Tests\Feature;

use App\Models\StaffMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StaffRoleApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_update_staff_role()
    {
        $user = User::create(['name' => 'Owner', 'phone' => '081400000003', 'password' => bcrypt('secret123'), 'role' => 'owner', 'status' => 'active', 'plan' => 'pro', 'slug' => 'owner-staff']);
        $staff = StaffMember::create(['user_id' => $user->id, 'custom_id' => 'st1', 'property_id' => 'prop-1', 'name' => 'Sari', 'role' => 'Staff', 'phone' => '0812', 'email' => 'sari@x.id', 'status' => 'Active']);

        $this->actingAs($user, 'sanctum')
            ->patchJson('/api/staff/st1/role', ['role' => 'Manager'])
            ->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertEquals('Manager', $staff->fresh()->role);
    }
}
```

```php
<?php
// backend/tests/Feature/WebsiteConfigDestroyApiTest.php
namespace Tests\Feature;

use App\Models\User;
use App\Models\WebsiteConfig;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WebsiteConfigDestroyApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_delete_own_website_config()
    {
        $user = User::create(['name' => 'Owner', 'phone' => '081400000004', 'password' => bcrypt('secret123'), 'role' => 'owner', 'status' => 'active', 'plan' => 'pro', 'slug' => 'owner-web']);
        WebsiteConfig::create(['user_id' => $user->id, 'property_id' => 'prop-1', 'template_id' => 'urban', 'subdomain' => 'demo', 'headline' => 'H', 'subheadline' => 'S', 'about_text' => 'A', 'accent_color' => '#000', 'whatsapp_direct' => '0812', 'sections' => [], 'is_published' => true]);

        $this->actingAs($user, 'sanctum')
            ->deleteJson('/api/website-configs/prop-1')
            ->assertStatus(200)
            ->assertJson(['ok' => true]);

        $this->assertNull(WebsiteConfig::where('user_id', $user->id)->where('property_id', 'prop-1')->first());
    }
}
```

- [ ] **Step 2: Run them to verify they fail**

Run: `cd backend && php artisan test --filter=BookingStatusApiTest --filter=OperationStatusApiTest --filter=StaffRoleApiTest --filter=WebsiteConfigDestroyApiTest`
Expected: FAIL — all four routes 404 (not yet defined)

- [ ] **Step 3: Add the controller methods**

Modify `backend/app/Http/Controllers/BookingController.php` — add before the closing `}` of the class:

```php
    public function updateStatus(Request $request, $id) {
        Booking::where('user_id', $request->user()->id)->where('custom_id', $id)->update(['status' => $request->input('status')]);
        return response()->json(['success' => true]);
    }
```

Modify `backend/app/Http/Controllers/OperationTaskController.php` — add before the closing `}` of the class:

```php
    public function updateStatus(Request $request, $id) {
        OperationTask::where('user_id', $request->user()->id)->where('custom_id', $id)->update(['status' => $request->input('status')]);
        return response()->json(['success' => true]);
    }
```

Modify `backend/app/Http/Controllers/StaffMemberController.php` — add before the closing `}` of the class:

```php
    public function updateRole(Request $request, $id) {
        StaffMember::where('user_id', $request->user()->id)->where('custom_id', $id)->update(['role' => $request->input('role')]);
        return response()->json(['success' => true]);
    }
```

Modify `backend/app/Http/Controllers/WebsiteConfigController.php` — add before the closing `}` of the class:

```php
    public function destroy(Request $request, $propertyId) {
        WebsiteConfig::where('user_id', $request->user()->id)->where('property_id', $propertyId)->delete();
        return response()->json(['ok' => true]);
    }
```

- [ ] **Step 4: Add the routes**

Modify `backend/routes/api.php` — inside the `plan:pro` group added in Task 5, add these four lines right after their respective existing routes:

```php
        Route::patch('/bookings/{id}/status', [\App\Http\Controllers\BookingController::class, 'updateStatus']);
```
(after the `destroy` line in the Bookings block)

```php
        Route::patch('/operations/{id}/status', [\App\Http\Controllers\OperationTaskController::class, 'updateStatus']);
```
(after the `destroy` line in the Operations block)

```php
        Route::patch('/staff/{id}/role', [\App\Http\Controllers\StaffMemberController::class, 'updateRole']);
```
(after the `destroy` line in the Staff block)

```php
        Route::delete('/website-configs/{propertyId}', [\App\Http\Controllers\WebsiteConfigController::class, 'destroy']);
```
(after the `store` line in the Website Configs block)

- [ ] **Step 5: Run the tests to verify they pass**

Run: `cd backend && php artisan test`
Expected: all PASS

- [ ] **Step 6: Wire `App.tsx`'s booking/operation status handlers to the new PATCH routes**

Modify `src/App.tsx` — in the `bookings` case's `onUpdateBookingStatus` handler, replace:

```tsx
            onUpdateBookingStatus={(bookingId, status) => {
              const updatedBookings = bookings.map(b => b.id === bookingId ? { ...b, status } : b);
              setBookings(updatedBookings);
              const found = updatedBookings.find(b => b.id === bookingId);
              if (found) syncToBackend('bookings', 'POST', found);
```

with:

```tsx
            onUpdateBookingStatus={(bookingId, status) => {
              const updatedBookings = bookings.map(b => b.id === bookingId ? { ...b, status } : b);
              setBookings(updatedBookings);
              syncToBackend(`bookings/${bookingId}/status`, 'PATCH', { status });
              const found = updatedBookings.find(b => b.id === bookingId);
```

(the rest of that block — the room-status side effects — is unchanged)

In the `operations` case's `onUpdateTaskStatus` handler, replace:

```tsx
            onUpdateTaskStatus={(id, status) => {
              const updatedTasks = operationTasks.map(t => t.id === id ? { ...t, status } : t);
              setOperationTasks(updatedTasks);
              const found = updatedTasks.find(t => t.id === id);
              if (found) syncToBackend('operations', 'POST', found);
            }}
```

with:

```tsx
            onUpdateTaskStatus={(id, status) => {
              const updatedTasks = operationTasks.map(t => t.id === id ? { ...t, status } : t);
              setOperationTasks(updatedTasks);
              syncToBackend(`operations/${id}/status`, 'PATCH', { status });
            }}
```

- [ ] **Step 7: Type-check the frontend**

Run: `npm run lint`
Expected: no new TypeScript errors

- [ ] **Step 8: Commit**

```bash
git add backend/app/Http/Controllers/BookingController.php backend/app/Http/Controllers/OperationTaskController.php backend/app/Http/Controllers/StaffMemberController.php backend/app/Http/Controllers/WebsiteConfigController.php backend/routes/api.php src/App.tsx backend/tests/Feature/BookingStatusApiTest.php backend/tests/Feature/OperationStatusApiTest.php backend/tests/Feature/StaffRoleApiTest.php backend/tests/Feature/WebsiteConfigDestroyApiTest.php
git commit -m "feat: fill CRUD gaps on pro-gated resources (status/role updates, website-config destroy)"
```

---

## Task 7: Frontend types + API client for plan fields

**Files:**
- Modify: `src/types.ts`
- Modify: `src/api.ts`

**Interfaces:**
- Produces: `AuthUser.effectivePlan: UserPlan`, `AuthUser.expiresAt?: string | null`; `ReportsAggregate` type; `authMe(): Promise<...>`; `fetchReports(params): Promise<ReportsAggregate>`; `setPlanLockedHandler(handler: (() => void) | null): void`. Consumed by Tasks 9 and 13.

- [ ] **Step 1: Extend `AuthUser` and add `ReportsAggregate` in `types.ts`**

Modify `src/types.ts` — replace the `AuthUser` interface:

```ts
export interface AuthUser {
  id: number;
  name: string;
  phone: string;
  slug: string;
  role: UserRole;
  status: UserAccountStatus;
  plan: UserPlan;
  effectivePlan: UserPlan;
  expiresAt?: string | null;
  email?: string;
}
```

Add this new interface after `StaffMember` at the end of the file:

```ts
export interface ReportsAggregate {
  totalRevenue: number;
  totalCosts: number;
  actualProfit: number;
  outstandingAmount: number;
  paidBillsCount: number;
  unpaidBillsCount: number;
  occupancyRate: number;
  roomStatusCounts: { terisi: number; kosong: number; perbaikan: number };
  trend: { name: string; income: number; expense: number }[];
  unpaidBills: {
    id: string;
    roomNumber: string;
    tenantName: string;
    paymentMethod?: string;
    status: string;
    remaining: number;
  }[];
}
```

- [ ] **Step 2: Extend `AuthResult`, add `authMe`/`fetchReports`/`setPlanLockedHandler`, wire PLAN_LOCKED detection in `api.ts`**

Modify `src/api.ts` — replace the `AuthResult` interface:

```ts
export interface AuthResult {
  token: string;
  user: {
    id: number;
    name: string;
    phone: string;
    slug?: string;
    role?: 'super_admin' | 'owner';
    status?: 'active' | 'suspended';
    plan?: 'basic' | 'pro';
    effectivePlan?: 'basic' | 'pro';
    expiresAt?: string | null;
  };
}
```

Add this near the top, right after the `isOfflineMode` declaration:

```ts
// ─── Plan-lock notification (decouples api.ts from React state) ──────────────

type PlanLockedHandler = () => void;
let planLockedHandler: PlanLockedHandler | null = null;

export const setPlanLockedHandler = (handler: PlanLockedHandler | null) => {
  planLockedHandler = handler;
};
```

Add `authMe` right after `authChangePassword`:

```ts
export const authMe = async (): Promise<AuthResult['user'] & { email?: string }> => {
  const res = await fetchWithAuth('/api/auth/me');
  const data = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(data?.error || data?.message || 'Gagal memuat data akun');
  }
  return data;
};
```

Add `fetchReports` right after `fetchPublicOwnerData`:

```ts
export const fetchReports = async (params: {
  mode: 'month' | 'range';
  month?: string;
  startDate?: string;
  endDate?: string;
}): Promise<import('./types').ReportsAggregate> => {
  const query = new URLSearchParams();
  query.set('mode', params.mode);
  if (params.month) query.set('month', params.month);
  if (params.startDate) query.set('startDate', params.startDate);
  if (params.endDate) query.set('endDate', params.endDate);

  const res = await fetchWithAuth(`/api/reports?${query.toString()}`);
  const data = await parseJsonResponse(res);
  if (!res.ok) {
    if (data?.code === 'PLAN_LOCKED') planLockedHandler?.();
    throw new Error(data?.error || 'Gagal memuat laporan');
  }
  return data;
};
```

In `fetchAllData`, replace the four `.then(r => r.ok ? r.json() : []).catch(() => [])` fetches for bookings/operations/staff/website-configs with a shared helper. Add this private helper just above `fetchAllData`:

```ts
const fetchProResource = async (path: string): Promise<any[]> => {
  try {
    const res = await fetchWithAuth(path);
    if (res.status === 403) {
      const data = await parseJsonResponse(res).catch(() => null);
      if (data?.code === 'PLAN_LOCKED') planLockedHandler?.();
      return [];
    }
    return res.ok ? res.json() : [];
  } catch {
    return [];
  }
};
```

Then replace, inside `fetchAllData`'s `Promise.all([...])`:

```ts
      fetchWithAuth('/api/bookings').then(r => r.ok ? r.json() : []).catch(() => []),
      fetchWithAuth('/api/operations').then(r => r.ok ? r.json() : []).catch(() => []),
      fetchWithAuth('/api/staff').then(r => r.ok ? r.json() : []).catch(() => []),
      fetchWithAuth('/api/website-configs').then(r => r.ok ? r.json() : []).catch(() => []),
```

with:

```ts
      fetchProResource('/api/bookings'),
      fetchProResource('/api/operations'),
      fetchProResource('/api/staff'),
      fetchProResource('/api/website-configs'),
```

In `syncToBackend`, replace the `if (!res.ok)` branch:

```ts
    if (!res.ok) {
      const errData = await parseJsonResponse(res).catch(() => null);
      console.warn(`[Hybrid API] Gagal sinkronisasi /api/${endpoint}`, errData?.error || '');
      return false;
    }
```

with:

```ts
    if (!res.ok) {
      const errData = await parseJsonResponse(res).catch(() => null);
      if (errData?.code === 'PLAN_LOCKED') planLockedHandler?.();
      console.warn(`[Hybrid API] Gagal sinkronisasi /api/${endpoint}`, errData?.error || '');
      return false;
    }
```

- [ ] **Step 3: Type-check**

Run: `npm run lint`
Expected: no TypeScript errors

- [ ] **Step 4: Commit**

```bash
git add src/types.ts src/api.ts
git commit -m "feat(frontend): add plan-aware API client (authMe, fetchReports, PLAN_LOCKED handling)"
```

---

## Task 8: `UpgradePromptModal` and `TrialBanner` components

**Files:**
- Create: `src/components/UpgradePromptModal.tsx`
- Create: `src/components/TrialBanner.tsx`

**Interfaces:**
- Produces: `UpgradePromptModal({ onClose: () => void })`; `TrialBanner({ expiresAt: string, effectivePlan: string, onUpgradeClick: () => void })`. Consumed by Task 9.

- [ ] **Step 1: Create `UpgradePromptModal.tsx`**

```tsx
import React from 'react';
import { Crown, X, Check } from '@phosphor-icons/react';

interface UpgradePromptModalProps {
  onClose: () => void;
}

const PRO_FEATURES = [
  'Booking online & manajemen reservasi',
  'Website publik properti',
  'Manajemen tugas operasional & tim staf',
  'Laporan keuangan & okupansi lengkap',
];

export function UpgradePromptModal({ onClose }: UpgradePromptModalProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-5 shadow-2xl relative animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 h-8 w-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center cursor-pointer"
        >
          <X weight="duotone" className="h-4 w-4 text-[#171A18]" />
        </button>

        <div className="h-12 w-12 rounded-2xl bg-[#173B30] text-[#F5F1E8] flex items-center justify-center">
          <Crown weight="duotone" className="h-6 w-6" />
        </div>

        <div>
          <h3 className="text-lg font-black text-[#171A18]">Fitur Pro Terkunci</h3>
          <p className="text-xs text-[#6E746F] mt-1 leading-relaxed">
            Upgrade ke paket Pro untuk membuka fitur pertumbuhan bisnis Anda.
          </p>
        </div>

        <ul className="space-y-2">
          {PRO_FEATURES.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-xs font-semibold text-[#171A18]">
              <Check weight="bold" className="h-4 w-4 text-[#173B30] shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <p className="text-[11px] text-[#6E746F] leading-relaxed bg-[#FBF9F5] p-3 rounded-xl">
          Hubungi tim BISNIESGO Living untuk mengaktifkan paket Pro pada akun Anda.
        </p>

        <button
          onClick={onClose}
          className="w-full py-3 bg-[#173B30] text-[#F5F1E8] rounded-xl text-xs font-extrabold hover:bg-[#0f2720] transition-colors cursor-pointer"
        >
          Mengerti
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `TrialBanner.tsx`**

```tsx
import React from 'react';
import { Clock, WarningCircle } from '@phosphor-icons/react';

interface TrialBannerProps {
  expiresAt: string;
  effectivePlan: string;
  onUpgradeClick: () => void;
}

export function TrialBanner({ expiresAt, effectivePlan, onUpgradeClick }: TrialBannerProps) {
  const expiry = new Date(expiresAt);
  const now = new Date();
  const daysLeft = Math.max(0, Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const isExpired = effectivePlan !== 'pro';

  return (
    <div className={`w-full text-xs font-bold py-2 px-4 flex items-center justify-between z-40 shrink-0 ${
      isExpired ? 'bg-rose-600 text-white' : 'bg-[#173B30] text-[#F5F1E8]'
    }`}>
      <span className="flex items-center gap-2">
        {isExpired ? <WarningCircle weight="duotone" className="h-4 w-4" /> : <Clock weight="duotone" className="h-4 w-4" />}
        {isExpired
          ? 'Masa uji coba Pro telah berakhir. Fitur Pro terkunci.'
          : `${daysLeft} hari tersisa dari masa uji coba Pro.`}
      </span>
      <button
        onClick={onUpgradeClick}
        className="bg-[#F5F1E8] text-[#173B30] px-3 py-1 rounded-lg text-[10px] font-extrabold hover:bg-white transition-colors cursor-pointer whitespace-nowrap"
      >
        Upgrade Sekarang →
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Type-check**

Run: `npm run lint`
Expected: no TypeScript errors (components aren't wired up yet, so no unused-import errors either since both are self-contained)

- [ ] **Step 4: Commit**

```bash
git add src/components/UpgradePromptModal.tsx src/components/TrialBanner.tsx
git commit -m "feat(frontend): add UpgradePromptModal and TrialBanner components"
```

---

## Task 9: Wire plan gating into `App.tsx`

**Files:**
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `authMe`, `setPlanLockedHandler` (Task 7); `UpgradePromptModal`, `TrialBanner` (Task 8); `AuthUser` (Task 7).
- Produces: `authUser` state and `lockedTabIds` array read by Task 10 (`SidebarAndNav`) and Task 13 (`ReportsView` doesn't need it, but shares the same locked-tab render guard).

- [ ] **Step 1: Add imports**

Modify `src/App.tsx` — add to the `types` import line:

```tsx
import { 
  Room, Tenant, Bill, Expense, Complaint, KostSettings, Property, 
  ComplaintStatus, RoomStatus, TenantStatus, HousekeepingStatus, UserRole,
  Booking, BookingStatus, WebsiteConfig, OperationTask, OperationStatus, StaffMember,
  AuthUser
} from './types';
```

Add to the `api` import line:

```tsx
import { fetchAllData, syncToBackend, getToken, clearToken, authLogout, authMe, setPlanLockedHandler, fetchPublicOwnerData, PublicOwnerData } from './api';
```

Add two new component imports after the `WhatsAppReminderModal` import:

```tsx
import { UpgradePromptModal } from './components/UpgradePromptModal';
import { TrialBanner } from './components/TrialBanner';
```

- [ ] **Step 2: Add the pro-tab constant and `authUser`/modal state**

Modify `src/App.tsx` — add right after the `DashboardTab` import block (before `export default function App()`):

```tsx
const PRO_TAB_IDS: DashboardTab[] = ['bookings', 'website', 'operations', 'team', 'reports'];
```

Inside `App()`, add this state near the `userRole` state declaration:

```tsx
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    try {
      const raw = localStorage.getItem('kostos_auth_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [upgradePromptOpen, setUpgradePromptOpen] = useState(false);

  const isProLockActive = authUser ? authUser.role !== 'super_admin' && authUser.effectivePlan !== 'pro' : false;
  const lockedTabIds: DashboardTab[] = isProLockActive ? PRO_TAB_IDS : [];
```

- [ ] **Step 3: Persist `authUser`, refresh it on entering the dashboard, register the plan-locked handler**

Add these effects right after the existing `// 1. INITIALIZE DATABASE FROM HYBRID API` effect block:

```tsx
  // Register the PLAN_LOCKED notification handler once
  useEffect(() => {
    setPlanLockedHandler(() => setUpgradePromptOpen(true));
    return () => setPlanLockedHandler(null);
  }, []);

  // Refresh the authenticated user (plan/trial fields) whenever we enter the dashboard
  useEffect(() => {
    if (authMode !== 'dashboard' || !getToken()) return;
    authMe().then((data: any) => {
      setAuthUser({
        id: data.id,
        name: data.name,
        phone: data.phone,
        slug: data.slug,
        role: data.role,
        status: data.status,
        plan: data.plan,
        effectivePlan: data.effectivePlan || data.plan,
        expiresAt: data.expiresAt ?? null,
      });
    }).catch(() => {});
  }, [authMode]);

  // Persist authUser for offline resilience
  useEffect(() => {
    if (authUser) {
      localStorage.setItem('kostos_auth_user', JSON.stringify(authUser));
    } else {
      localStorage.removeItem('kostos_auth_user');
    }
  }, [authUser]);
```

- [ ] **Step 4: Clear `authUser` on logout**

Modify the `handleLogout` function — add `setAuthUser(null);` right after `setIsDemoMode(false);`:

```tsx
  const handleLogout = () => {
    clearToken();
    localStorage.removeItem('kostos_logged_in');
    localStorage.removeItem('kostos_owner_slug');
    localStorage.removeItem('kostos_user_role');
    setIsDemoMode(false);
    setAuthUser(null);
    setUserRole('owner');
    setSelectedTab('dashboard');
    navigateTo({ authMode: 'landing' }, { replace: true });
  };
```

- [ ] **Step 5: Guard `renderTabContent` for direct navigation into a locked tab**

Modify the top of `renderTabContent`, right after `const renderTabContent = () => {`:

```tsx
  const renderTabContent = () => {
    if (lockedTabIds.includes(selectedTab)) {
      return (
        <div className="bg-white rounded-[32px] p-10 text-center space-y-4 max-w-md mx-auto animate-fade-in-up">
          <p className="text-sm font-bold text-[#171A18]">Fitur ini memerlukan paket Pro.</p>
          <p className="text-xs text-[#6E746F]">Upgrade akun Anda untuk membuka tab ini.</p>
          <button
            onClick={() => setUpgradePromptOpen(true)}
            className="px-5 py-2.5 bg-[#173B30] text-[#F5F1E8] rounded-xl text-xs font-extrabold hover:bg-[#0f2720] transition-colors cursor-pointer"
          >
            Lihat Detail Upgrade
          </button>
        </div>
      );
    }

    switch (selectedTab) {
```

- [ ] **Step 6: Guard tab navigation from the sidebar**

Modify the `<SidebarAndNav onChangeTab={...}>` prop:

```tsx
          onChangeTab={(tab) => {
            if (lockedTabIds.includes(tab as DashboardTab)) {
              setUpgradePromptOpen(true);
              return;
            }
            setSelectedRoomId(null);
            setSelectedTenantId(null);
            setSelectedBillId(null);
            setSelectedComplaintId(null);
            setBillForPayment(null);
            navigateTo({ authMode: 'dashboard', tab: tab as DashboardTab });
          }}
```

Pass `lockedTabIds` to `SidebarAndNav` (for the lock-badge rendering added in Task 10) by adding this prop right after `userRole={userRole}`:

```tsx
          lockedTabIds={lockedTabIds}
```

- [ ] **Step 7: Render the trial banner and the upgrade modal**

Modify the demo-mode banner block — add the trial banner right after it (still inside the dashboard-mode `<div className="min-h-screen ...">`, before `<div className="flex flex-col lg:flex-row flex-1 min-h-0">`):

```tsx
      {/* TRIAL / EXPIRED BANNER */}
      {authUser && authUser.role !== 'super_admin' && authUser.plan === 'pro' && authUser.expiresAt && (
        <TrialBanner
          expiresAt={authUser.expiresAt}
          effectivePlan={authUser.effectivePlan}
          onUpgradeClick={() => setUpgradePromptOpen(true)}
        />
      )}
```

Add the modal render at the very end of the dashboard JSX, right after the `WhatsAppReminderModal` block, before the closing `</div>` of the component's return:

```tsx
      {/* UPGRADE PROMPT MODAL */}
      {upgradePromptOpen && (
        <UpgradePromptModal onClose={() => setUpgradePromptOpen(false)} />
      )}
```

- [ ] **Step 8: Type-check**

Run: `npm run lint`
Expected: no TypeScript errors

- [ ] **Step 9: Commit**

```bash
git add src/App.tsx
git commit -m "feat(frontend): wire plan-based tab locking, trial banner, and upgrade modal into App"
```

---

## Task 10: Lock badges in `SidebarAndNav`

**Files:**
- Modify: `src/components/SidebarAndNav.tsx`

**Interfaces:**
- Consumes: `lockedTabIds: DashboardTab[]` prop from `App.tsx` (Task 9). Renders only — does not intercept clicks (App.tsx already gates `onChangeTab`).

- [ ] **Step 1: Add the `lockedTabIds` prop and the `Lock` icon import**

Modify `src/components/SidebarAndNav.tsx` — update the icon import line:

```tsx
import { SquaresFour, House, Users, Receipt, CalendarCheck, Wrench, ChartBar, Gear, SignOut, CaretRight, Buildings, Globe, Crown, Shield, Laptop, DotsThree, X, ArrowUpRight, Sparkle, Lock } from '@phosphor-icons/react';
```

Update the props interface:

```tsx
interface SidebarAndNavProps {
  currentTab: string;
  onChangeTab: (tab: string) => void;
  onLogout: () => void;
  kostName: string;
  ownerName: string;
  onQuickPlus?: () => void;
  properties?: Property[];
  selectedPropertyId?: string;
  onViewGuestPortal?: () => void;
  userRole?: UserRole;
  lockedTabIds?: string[];
}
```

Update the destructured props:

```tsx
export function SidebarAndNav({ 
  currentTab, 
  onChangeTab, 
  onLogout, 
  kostName, 
  ownerName, 
  onQuickPlus,
  properties = [],
  selectedPropertyId = 'all',
  onViewGuestPortal,
  userRole = 'owner',
  lockedTabIds = []
}: SidebarAndNavProps) {
```

- [ ] **Step 2: Render the lock badge on the desktop sidebar items**

Modify the desktop nav button's inner content — replace:

```tsx
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-[#173B30]' : 'text-emerald-300'
                  }`} />
                  <span>{item.label}</span>
                </div>
              </button>
```

with:

```tsx
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-[#173B30]' : 'text-emerald-300'
                  }`} />
                  <span>{item.label}</span>
                </div>
                {lockedTabIds.includes(item.id) && (
                  <Lock weight="fill" className={`h-3 w-3 shrink-0 ${isActive ? 'text-[#B89A68]' : 'text-emerald-400/70'}`} />
                )}
              </button>
```

- [ ] **Step 3: Render the lock badge on the mobile "More" grid items**

Modify the mobile grid item card — replace:

```tsx
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">{item.label}</p>
                        <p className={`text-[10px] truncate ${isActive ? 'text-emerald-200' : 'text-[#6E746F]'}`}>
                          {item.desc}
                        </p>
                      </div>
```

with:

```tsx
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate flex items-center gap-1">
                          {item.label}
                          {lockedTabIds.includes(item.id) && (
                            <Lock weight="fill" className="h-2.5 w-2.5 text-[#B89A68] shrink-0" />
                          )}
                        </p>
                        <p className={`text-[10px] truncate ${isActive ? 'text-emerald-200' : 'text-[#6E746F]'}`}>
                          {item.desc}
                        </p>
                      </div>
```

- [ ] **Step 4: Type-check**

Run: `npm run lint`
Expected: no TypeScript errors

- [ ] **Step 5: Manual verification**

Run: use the `run` skill (or `npm run dev`) to launch the app, log in as a `basic`-plan user (or one created via `PATCH /api/admin/users/{id}/plan`), and confirm: Booking/Website/Operasional/Tim/Laporan show a lock badge in both the desktop sidebar and the mobile "More" sheet, and clicking them opens the upgrade modal instead of navigating.

- [ ] **Step 6: Commit**

```bash
git add src/components/SidebarAndNav.tsx
git commit -m "feat(frontend): render pro lock badges in sidebar and mobile nav"
```

---

## Task 11: Move `ReportsView` to the server-side aggregate

**Files:**
- Modify: `src/components/ReportsView.tsx`

**Interfaces:**
- Consumes: `fetchReports` (Task 7).

- [ ] **Step 1: Replace client-side computation with a server fetch**

Rewrite `src/components/ReportsView.tsx`:

```tsx
import React, { useState, useEffect } from 'react';
import { ChartBar, TrendUp, Users, CheckCircle, TrendDown, ArrowUpRight, CalendarBlank, Faders } from '@phosphor-icons/react';
import { fetchReports } from '../api';
import { ReportsAggregate } from '../types';

interface ReportsViewProps {
  selectedMonth: string;
}

export function ReportsView({ selectedMonth }: ReportsViewProps) {
  const [reportTab, setReportTab] = useState<'financial' | 'occupancy'>('financial');
  const [filterMode, setFilterMode] = useState<'month' | 'range'>('month');
  const [startDate, setStartDate] = useState('2026-05-01');
  const [endDate, setEndDate] = useState('2026-06-30');
  const [data, setData] = useState<ReportsAggregate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    fetchReports(
      filterMode === 'month'
        ? { mode: 'month', month: selectedMonth }
        : { mode: 'range', startDate, endDate }
    )
      .then(setData)
      .catch((err) => setError(err.message || 'Gagal memuat laporan'))
      .finally(() => setLoading(false));
  }, [filterMode, selectedMonth, startDate, endDate]);

  const getDaysDiff = () => {
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return isNaN(diff) ? 0 : diff;
  };

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  const formatIndoDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length !== 3) return dateStr;
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const day = parseInt(parts[2], 10);
      const monthIdx = parseInt(parts[1], 10) - 1;
      const year = parts[0];
      return `${day} ${months[monthIdx]} ${year}`;
    } catch {
      return dateStr;
    }
  };

  if (loading && !data) {
    return <div className="p-12 text-center text-[#6E746F] text-xs font-bold">Memuat laporan...</div>;
  }

  if (error) {
    return <div className="p-12 text-center text-rose-600 text-xs font-bold">{error}</div>;
  }

  if (!data) return null;

  const {
    totalRevenue, totalCosts, actualProfit, outstandingAmount,
    unpaidBillsCount, occupancyRate, roomStatusCounts, trend, unpaidBills,
  } = data;

  const maxValue = Math.max(...trend.map(d => Math.max(d.income, d.expense)), 1);
  const svgWidth = 400;
  const svgHeight = 150;
  const svgPadding = 30;
  const plotWidth = svgWidth - svgPadding * 2;
  const plotHeight = svgHeight - 20;

  const toSvgX = (i: number) => svgPadding + (i / (trend.length - 1 || 1)) * plotWidth;
  const toSvgY = (val: number) => svgHeight - 10 - (val / maxValue) * (plotHeight - 20);

  const incomePath = trend.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toSvgX(i)} ${toSvgY(d.income)}`).join(' ');
  const expensePath = trend.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toSvgX(i)} ${toSvgY(d.expense)}`).join(' ');

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto px-1 sm:px-0">

      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-[32px] shadow-sm animate-fade-in-up">
        <div className="flex bg-[#FBF9F5] p-1 rounded-xl border border-[rgba(23,59,48,0.15)]/30 w-full md:max-w-xs shrink-0 select-none">
          <button
            onClick={() => setReportTab('financial')}
            className={`flex-grow py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 active:scale-[0.98] ${
              reportTab === 'financial' ? 'bg-[#173B30] text-white shadow-xs' : 'text-[#6E746F] hover:text-[#171A18]'
            }`}
          >
            <ChartBar className="h-3.5 w-3.5" />
            Laporan Keuangan
          </button>
          <button
            onClick={() => setReportTab('occupancy')}
            className={`flex-grow py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 active:scale-[0.98] ${
              reportTab === 'occupancy' ? 'bg-[#173B30] text-white shadow-xs' : 'text-[#6E746F] hover:text-[#171A18]'
            }`}
          >
            <Users weight="duotone" className="h-3.5 w-3.5" />
            Hunian & Kamar
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-auto">
          <span className="text-[10px] font-extrabold text-[#6E746F] uppercase tracking-wider hidden md:inline shrink-0">Metode Analisis:</span>
          <div className="flex bg-[#FBF9F5] p-1 rounded-xl border border-[rgba(23,59,48,0.15)]/30 w-full sm:w-auto select-none">
            <button
              onClick={() => setFilterMode('month')}
              className={`flex-grow sm:flex-initial justify-center px-3 py-1.5 bg-transparent rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-[0.98] ${
                filterMode === 'month' ? 'bg-white text-[#171A18] shadow-xs' : 'text-[#6E746F] hover:text-[#171A18]'
              }`}
            >
              <CalendarBlank weight="duotone" className="h-3.5 w-3.5 shrink-0" />
              <span className="whitespace-nowrap">Bulan ({selectedMonth})</span>
            </button>
            <button
              onClick={() => setFilterMode('range')}
              className={`flex-grow sm:flex-initial justify-center px-3 py-1.5 bg-transparent rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-[0.98] ${
                filterMode === 'range' ? 'bg-white text-[#171A18] shadow-xs' : 'text-[#6E746F] hover:text-[#171A18]'
              }`}
            >
              <Faders weight="duotone" className="h-3.5 w-3.5 shrink-0" />
              <span className="whitespace-nowrap">Rentang Custom</span>
            </button>
          </div>
        </div>
      </div>

      {filterMode === 'range' && (
        <div className="bg-white border border-[rgba(23,59,48,0.06)] p-3.5 xs:p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xs space-y-4 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 items-end">
            <div className="space-y-1">
              <label className="block text-[10px] font-extrabold text-[#6E746F] uppercase tracking-wider">Mulai Tanggal</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-3 border border-[rgba(23,59,48,0.15)] rounded-xl text-xs font-bold text-[#171A18] focus:outline-none focus:border-[#173B30] focus:ring-1 focus:ring-[#173B30] transition-all bg-white/50 min-h-[44px]"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-extrabold text-[#6E746F] uppercase tracking-wider">Sampai Tanggal</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-3 border border-[rgba(23,59,48,0.15)] rounded-xl text-xs font-bold text-[#171A18] focus:outline-none focus:border-[#173B30] focus:ring-1 focus:ring-[#173B30] transition-all bg-white/50 min-h-[44px]"
              />
            </div>
            <div className="bg-white/80 border border-[rgba(23,59,48,0.06)] p-3 rounded-xl text-[10px] font-bold text-[#6E746F] flex justify-between items-center sm:col-span-2 lg:col-span-1 min-h-[44px]">
              <span>Masa Evaluasi:</span>
              <span className="text-[#0f2720] font-extrabold bg-[#F5F1E8] px-2.5 py-1 rounded-md font-mono text-[11px]">{getDaysDiff()} Hari Kalender</span>
            </div>
          </div>
        </div>
      )}

      {reportTab === 'financial' && (
        <>
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            <div className="bg-white border border-[rgba(23,59,48,0.1)] p-3 sm:p-4 rounded-xl sm:rounded-2xl flex flex-col justify-between overflow-hidden shadow-2xs hover:shadow-xs transition-all">
              <span className="text-[9px] xs:text-[10px] font-extrabold text-[#6E746F] block uppercase tracking-wider truncate">Pemasukan Kas</span>
              <h3 className="text-sm xs:text-base sm:text-lg lg:text-xl font-black text-emerald-600 mt-1.5 font-mono truncate" title={formatIDR(totalRevenue)}>
                {formatIDR(totalRevenue)}
              </h3>
              <p className="text-[8px] xs:text-[9px] text-[#6E746F] mt-1 truncate">Sewa & penunjang</p>
            </div>

            <div className="bg-white border border-[rgba(23,59,48,0.1)] p-3 sm:p-4 rounded-xl sm:rounded-2xl flex flex-col justify-between overflow-hidden shadow-2xs hover:shadow-xs transition-all">
              <span className="text-[9px] xs:text-[10px] font-extrabold text-[#6E746F] block uppercase tracking-wider truncate">Pengeluaran Ops</span>
              <h3 className="text-sm xs:text-base sm:text-lg lg:text-xl font-black text-rose-600 mt-1.5 font-mono truncate" title={formatIDR(totalCosts)}>
                {formatIDR(totalCosts)}
              </h3>
              <p className="text-[8px] xs:text-[9px] text-[#6E746F] mt-1 truncate">Reparasi & token</p>
            </div>

            <div className="bg-white border border-[rgba(23,59,48,0.1)] p-3 sm:p-4 rounded-xl sm:rounded-2xl flex flex-col justify-between overflow-hidden shadow-2xs hover:shadow-xs transition-all">
              <span className="text-[9px] xs:text-[10px] font-extrabold text-[#6E746F] block uppercase tracking-wider truncate">Laba Bersih</span>
              <h3 className={`text-sm xs:text-base sm:text-lg lg:text-xl font-black mt-1.5 font-mono truncate ${actualProfit >= 0 ? 'text-[#0f2720]' : 'text-[#171A18]'}`} title={formatIDR(actualProfit)}>
                {formatIDR(actualProfit)}
              </h3>
              <p className="text-[8px] xs:text-[9px] text-[#6E746F] mt-1 truncate">Est. Laba bersih</p>
            </div>

            <div className="bg-white border border-[rgba(23,59,48,0.1)] p-3 sm:p-4 rounded-xl sm:rounded-2xl flex flex-col justify-between overflow-hidden shadow-2xs hover:shadow-xs transition-all">
              <span className="text-[9px] xs:text-[10px] font-extrabold text-[#6E746F] block uppercase tracking-wider truncate">Tunggakan</span>
              <h3 className="text-sm xs:text-base sm:text-lg lg:text-xl font-black text-[#B89A68] mt-1.5 font-mono truncate" title={formatIDR(outstandingAmount)}>
                {formatIDR(outstandingAmount)}
              </h3>
              <p className="text-[8px] xs:text-[9px] text-[#6E746F] mt-1 truncate">{unpaidBillsCount} kamar belum setor</p>
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
            <div className="bg-white rounded-[32px] p-5 shadow-sm lg:col-span-8 space-y-4">
              <div>
                <h4 className="text-sm font-bold text-[#171A18] tracking-tight">Grafik Pertumbuhan Kas</h4>
                <p className="text-xs text-[#6E746F] mt-1">Tren penerimaan bersih lunas.</p>
              </div>

              <div className="w-full bg-white border border-[rgba(23,59,48,0.06)] rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col justify-between overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[10px] text-[#6E746F]">
                  <span className="font-semibold">Max: {formatIDR(maxValue)}</span>
                  <div className="flex flex-wrap gap-2.5">
                    <span className="flex items-center gap-1 font-semibold"><span className="h-2 w-2 rounded-full bg-[#173B30]"></span>Pendapatan</span>
                    <span className="flex items-center gap-1 font-semibold"><span className="h-2 w-2 rounded-full bg-rose-500"></span>Biaya</span>
                  </div>
                </div>

                <div className="flex-1 relative mt-3 flex items-end">
                  <div className="w-full h-[140px] xs:h-[160px] sm:h-[180px]">
                    <svg viewBox="0 0 400 150" className="w-full h-full stroke-2 fill-none overflow-visible">
                      <line x1="0" y1="25" x2="400" y2="25" stroke="#f1f5f9" strokeDasharray="3" />
                      <line x1="0" y1="75" x2="400" y2="75" stroke="#f1f5f9" strokeDasharray="3" />
                      <line x1="0" y1="125" x2="400" y2="125" stroke="#f1f5f9" strokeDasharray="3" />

                      <path d={incomePath} stroke="#0d9488" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                      {trend.map((d, i) => (
                        <circle key={`inc-${i}`} cx={toSvgX(i)} cy={toSvgY(d.income)} r="5" fill="#ffffff" stroke="#0d9488" strokeWidth="3" />
                      ))}

                      <path d={expensePath} stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      {trend.map((d, i) => (
                        <circle key={`exp-${i}`} cx={toSvgX(i)} cy={toSvgY(d.expense)} r="4" fill="#ffffff" stroke="#f43f5e" strokeWidth="2.5" />
                      ))}
                    </svg>
                  </div>
                </div>

                <div className="flex justify-between text-[9px] sm:text-[10px] font-bold text-[#6E746F] border-t border-[rgba(23,59,48,0.06)] pt-2.5 font-mono gap-1">
                  {trend.map((d, i) => (
                    <span key={i} className="flex-1 text-center truncate">{d.name}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[32px] p-5 shadow-sm lg:col-span-4 space-y-4">
              <h4 className="text-sm font-bold text-[#171A18] tracking-tight">Rasio Realisasi</h4>

              <div className="space-y-4">
                <div className="p-3 border border-[rgba(23,59,48,0.06)] bg-white/50 rounded-xl text-[10px] sm:text-[11px] font-semibold text-[#6E746F] block leading-relaxed space-y-1 font-sans">
                  <p className="font-extrabold text-[#171A18] text-xs">Pencapaian Cashflow:</p>
                  <p className="flex justify-between"><span>Lunas Penuh (Realisasi):</span> <span className="text-[#0f2720] font-extrabold">{formatIDR(totalRevenue)}</span></p>
                  <p className="flex justify-between"><span>Tunggakan Outstanding:</span> <span className="text-rose-600 font-extrabold">{formatIDR(outstandingAmount)}</span></p>
                  <p className="flex justify-between pt-1 border-t border-[rgba(23,59,48,0.15)] font-bold"><span>Target Kas Maksimal:</span> <span className="text-[#171A18] font-black">{formatIDR(totalRevenue + outstandingAmount)}</span></p>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-extrabold">
                    <span className="text-[#6E746F]">Kolektabilitas Selesai:</span>
                    <span className="text-[#0f2720] font-mono">
                      {((totalRevenue + outstandingAmount) > 0 ? (totalRevenue / (totalRevenue + outstandingAmount)) * 100 : 0).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-[#FBF9F5] h-2 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${((totalRevenue + outstandingAmount) > 0 ? (totalRevenue / (totalRevenue + outstandingAmount)) * 100 : 0)}%` }}
                      className="bg-[#173B30] h-full rounded-full transition-all duration-500 ease-out"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {reportTab === 'occupancy' && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-white rounded-[32px] p-5 shadow-sm text-center space-y-4 mx-auto w-full">
            <h4 className="text-sm font-bold text-[#171A18] tracking-tight text-left border-b border-zinc-100 pb-2">Tingkat Hunian</h4>

            <div className="relative h-40 w-40 sm:h-44 sm:w-44 mx-auto flex items-center justify-center select-none">
              <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="12" fill="transparent" />
                <circle
                  cx="50" cy="50" r="40" stroke="#0d9488" strokeWidth="12" fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - occupancyRate / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="text-center translate-y-[-1px]">
                <p className="text-3xl sm:text-4xl font-extrabold text-[#171A18] tracking-tighter font-mono">{occupancyRate.toFixed(0)}%</p>
                <p className="text-[9px] sm:text-[10px] text-[#6E746F] font-bold uppercase mt-0.5">Hunian Aktif</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5 pt-2 text-[10px] sm:text-[11px] font-semibold text-[#6E746F]">
              <div className="p-1 px-1.5 border border-[rgba(23,59,48,0.06)] bg-white/55 rounded-xl overflow-hidden leading-tight">
                <span className="text-[#6E746F] block text-[8px] xs:text-[9px] tracking-wider font-extrabold">TERISI</span>
                <span className="font-extrabold text-[#0f2720] text-[10px] sm:text-xs block truncate mt-0.5">{roomStatusCounts.terisi} Kamar</span>
              </div>
              <div className="p-1 px-1.5 border border-[rgba(23,59,48,0.06)] bg-white/55 rounded-xl overflow-hidden leading-tight">
                <span className="text-[#6E746F] block text-[8px] xs:text-[9px] tracking-wider font-extrabold">KOSONG</span>
                <span className="font-extrabold text-[#6E746F] text-[10px] sm:text-xs block truncate mt-0.5">{roomStatusCounts.kosong} Kamar</span>
              </div>
              <div className="p-1 px-1.5 border border-[rgba(23,59,48,0.06)] bg-white/55 rounded-xl overflow-hidden leading-tight">
                <span className="text-[#6E746F] block text-[8px] xs:text-[9px] tracking-wider font-extrabold">PERBAIKAN</span>
                <span className="font-extrabold text-orange-700 text-[10px] sm:text-xs block truncate mt-0.5">{roomStatusCounts.perbaikan} Kamar</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[32px] p-5 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-[#171A18] tracking-tight border-b border-zinc-100 pb-2">Status Pembukuan Kamar</h4>

            <div className="space-y-4">
              <p className="text-[11px] sm:text-xs text-[#6E746F] leading-relaxed font-semibold">
                Berikut adalah denda/tunggakan per-kamar penyewa untuk {filterMode === 'month' ? `bulan ${selectedMonth}` : 'periode kustom terpilih'}.
              </p>

              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[rgba(23,59,48,0.15)]">
                {unpaidBills.map((b) => (
                  <div key={b.id} className="p-3 border border-[rgba(23,59,48,0.06)] rounded-xl bg-white/40 flex justify-between items-center text-xs font-semibold hover:bg-white transition-colors">
                    <div className="min-w-0 mr-2">
                      <p className="font-bold text-[#171A18] truncate">Kamar {b.roomNumber} - {b.tenantName}</p>
                      <p className="text-[9px] text-[#6E746F] font-semibold font-mono mt-0.5 font-sans">Metode: {b.paymentMethod || 'Manual'} ({b.status})</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono text-rose-600 font-extrabold">{formatIDR(b.remaining)}</p>
                      <p className="text-[9px] text-[#6E746F] font-semibold">Tunggakan</p>
                    </div>
                  </div>
                ))}

                {unpaidBills.length === 0 && (
                  <div className="text-center py-8 text-[#6E746F]">
                    <CheckCircle weight="duotone" className="h-8 w-8 text-[#173B30] mx-auto mb-2 animate-bounce" />
                    <p className="text-xs italic font-bold">Seluruh kamar lunas sejalan tertib! Hebat ✓</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
```

- [ ] **Step 2: Update the `reports` case in `App.tsx` to match the trimmed props**

Modify `src/App.tsx` — replace the `reports` case:

```tsx
      case 'reports':
        return (
          <ReportsView
            bills={filteredBills}
            rooms={filteredRooms}
            tenants={filteredTenants}
            expenses={filteredExpenses}
            selectedMonth={selectedMonth}
          />
        );
```

with:

```tsx
      case 'reports':
        return (
          <ReportsView
            selectedMonth={selectedMonth}
          />
        );
```

- [ ] **Step 3: Type-check**

Run: `npm run lint`
Expected: no TypeScript errors

- [ ] **Step 4: Manual verification**

Run: use the `run` skill to launch the app, log in as a pro user, open the Laporan tab, and confirm the financial KPIs, trend chart, occupancy donut, and unpaid-bills list render with real numbers matching what `/api/reports` returns (compare against a `curl`/browser devtools network call to the endpoint for the same user).

- [ ] **Step 5: Commit**

```bash
git add src/components/ReportsView.tsx src/App.tsx
git commit -m "feat(frontend): fetch Reports aggregates from the server instead of computing client-side"
```

---

## Final Verification

- [ ] **Step 1: Full backend suite**

Run: `cd backend && php artisan test`
Expected: all tests PASS

- [ ] **Step 2: Frontend type-check**

Run: `npm run lint`
Expected: no TypeScript errors

- [ ] **Step 3: Manual end-to-end pass**

Using the `run` skill: register a new account (confirm 7-day trial banner appears and all tabs are unlocked), use `PATCH /api/admin/users/{id}/plan` as a super_admin to downgrade it to `basic` (confirm Booking/Website/Operasional/Tim/Laporan show lock badges, clicking them opens the upgrade modal, and direct URL navigation to `#/app/reports` shows the locked placeholder instead of the view), then upgrade back to `pro` and confirm the tabs unlock and the Reports view loads real data.

- [ ] **Step 4: Invoke code review**

Use `superpowers:requesting-code-review` before merging.
