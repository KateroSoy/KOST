# Laravel Backend (Rooms + Tenants) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Laravel API in `backend/` covering `rooms` and `tenants` (with the tenant↔room↔bill business rules), connected to the same remote MySQL database the Express backend already uses — as the first slice of a full Express→Laravel migration.

**Architecture:** Laravel 12 app in `backend/`, Eloquent models mapped onto the existing `kostos_*` tables (string primary keys, no timestamps, camelCase columns — matching the schema Express already created), thin controllers under `routes/api.php`, no auth, no request validation layer (mirrors Express's current lack of validation).

**Tech Stack:** PHP 8.2, Laravel 12, MySQL (remote, Hostinger hPanel), PHPUnit (Laravel's default test runner).

## Global Constraints

- All application tables are prefixed `kostos_` — the hPanel database is shared with a live WordPress site and a separate Laravel ERP app; never create or touch a non-`kostos_`-prefixed table.
- Never run `migrate:fresh`, `migrate:refresh`, or use the `RefreshDatabase`/`DatabaseMigrations` test traits against this database — it holds real, shared data.
- No request validation layer (FormRequest) — Express does not validate request bodies today either; this phase preserves that behavior exactly.
- No auth/Sanctum in this phase.
- `server/` (Express) and `src/` (React frontend) are not modified in this phase — Laravel runs standalone on its own port.
- Every Feature test that writes data uses an id prefixed `smoke-` (e.g. `smoke-room-<timestamp>`) and explicitly deletes everything it created before the test ends — never rely on a database reset.

---

### Task 1: PHP toolchain + Laravel environment for the remote MySQL database

**Files:**
- Modify: `backend/.env`
- Modify: `backend/.env.example`
- Modify: `backend/config/database.php:129-131`
- Modify: `backend/phpunit.xml`
- Delete: `backend/database/migrations/0001_01_01_000000_create_users_table.php`
- Delete: `backend/database/migrations/0001_01_01_000001_create_cache_table.php`
- Delete: `backend/database/migrations/0001_01_01_000002_create_jobs_table.php`

**Interfaces:**
- Produces: a working `php` and `composer` CLI on PATH; a `backend/.env` configured for `DB_CONNECTION=mysql` against the shared remote database; a `kostos_migrations` tracking table (instead of Laravel's default `migrations`) so this app's migration bookkeeping never collides with the other Laravel app on the same database. All later tasks assume `php artisan migrate` and `php artisan test` work and hit the real remote MySQL.

- [ ] **Step 1: Install PHP + Composer (manual, one-time)**

This machine has no `php` CLI (verified: `php -v` → "command not found"). This step is manual — a GUI installer wizard can't be scripted reliably.

1. Download Laragon (bundles PHP 8.2+, Composer, and a MySQL client — we won't use Laragon's own MySQL, we connect to the remote hPanel one) from `https://laragon.org/download/` and run the installer, accepting the defaults (installs to `C:\laragon`).
2. After install, find the bundled PHP folder, e.g. `C:\laragon\bin\php\php-8.2.<x>`. Add that folder **and** `C:\laragon\bin\composer` to your user PATH (Windows Settings → "Edit environment variables for your account" → `Path` → New).
3. Open a **new** terminal (PATH changes don't apply to already-open shells) and verify:

Run: `php -v`
Expected: prints `PHP 8.2.<x> (cli) ...` (any 8.2+ patch version)

Run: `composer -V`
Expected: prints `Composer version 2.<x>...`

- [ ] **Step 2: Point Laravel at the shared remote MySQL database**

Open the repo root `.env` (already configured with the live hPanel credentials Express uses — gitignored, not committed). Copy its `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` values into `backend/.env`, replacing the existing DB block:

```
DB_CONNECTION=mysql
DB_HOST=<value of DB_HOST from root .env>
DB_PORT=<value of DB_PORT from root .env>
DB_DATABASE=<value of DB_NAME from root .env>
DB_USERNAME=<value of DB_USER from root .env>
DB_PASSWORD=<value of DB_PASSWORD from root .env>
```

Also in `backend/.env`, change these three lines so Laravel never needs its own `sessions`/`cache`/`jobs` tables in the shared database (this API has no web sessions, cache, or queues in this phase):

```
SESSION_DRIVER=file
CACHE_STORE=file
QUEUE_CONNECTION=sync
```

Make the same DB/session/cache/queue edits in `backend/.env.example` but leave the credential values as placeholders (`isi-hostname-mysql-dari-hpanel`, etc., matching the style already used in `server/.env.example`) — this file is committed, so it must never contain real credentials.

- [ ] **Step 3: Delete the default Laravel migrations that would create unwanted tables**

These three migrations would create `users`, `cache`, `cache_locks`, `jobs`, `job_batches`, and `failed_jobs` tables directly in the shared database — none of which this app needs (no auth, no db cache/queue after Step 2). Delete them:

```bash
cd backend
rm database/migrations/0001_01_01_000000_create_users_table.php
rm database/migrations/0001_01_01_000001_create_cache_table.php
rm database/migrations/0001_01_01_000002_create_jobs_table.php
```

- [ ] **Step 4: Rename Laravel's migration-tracking table to `kostos_migrations`**

In `backend/config/database.php`, find:

```php
    'migrations' => [
        'table' => 'migrations',
```

Change `'migrations'` to `'kostos_migrations'`:

```php
    'migrations' => [
        'table' => 'kostos_migrations',
```

- [ ] **Step 5: Stop PHPUnit from forcing an in-memory SQLite database**

`backend/phpunit.xml` currently overrides the DB connection for tests to in-memory SQLite, which would hide real integration bugs and contradicts this project's testing approach (Feature tests must hit the real shared MySQL, using `smoke-*` ids with explicit teardown — see Global Constraints). Open `backend/phpunit.xml` and delete these two lines from the `<php>` block:

```xml
        <env name="DB_CONNECTION" value="sqlite"/>
        <env name="DB_DATABASE" value=":memory:"/>
```

Replace them with a comment explaining why they're gone:

```xml
        <!-- No DB_CONNECTION/DB_DATABASE override here on purpose: tests run
             against the same shared remote MySQL as `.env` (see docs/superpowers/specs/2026-07-08-laravel-backend-mysql-design.md).
             Never add RefreshDatabase/DatabaseMigrations — this DB is shared
             with other live applications. -->
```

- [ ] **Step 6: Verify connectivity to the remote database**

```bash
cd backend
php artisan key:generate
php artisan config:clear
php artisan migrate
```

`key:generate` fills `APP_KEY` in `backend/.env` (empty in the skeleton) — required before Laravel will boot for any HTTP request.

Expected: no pending migrations remain (Steps 1-3 deleted the only ones that existed), and the command creates the `kostos_migrations` table on the remote database. Output should NOT show any error connecting to MySQL.

```bash
php artisan tinker --execute="echo DB::table('kostos_settings')->count();"
```

Expected: prints `1` (the singleton settings row Express already seeded) — confirms Laravel is reading the real shared database, not a local one.

- [ ] **Step 7: Commit**

```bash
git add backend/.env.example backend/config/database.php backend/phpunit.xml
git add backend/database/migrations/0001_01_01_000000_create_users_table.php backend/database/migrations/0001_01_01_000001_create_cache_table.php backend/database/migrations/0001_01_01_000002_create_jobs_table.php
git commit -m "feat(backend): configure Laravel for the shared remote MySQL database"
```

(`backend/.env` itself is gitignored and never committed — only `.env.example` is.)

---

### Task 2: API routing skeleton + health check

**Files:**
- Create: `backend/routes/api.php`
- Modify: `backend/bootstrap/app.php`
- Test: `backend/tests/Feature/HealthTest.php`
- Delete: `backend/tests/Feature/ExampleTest.php`

**Interfaces:**
- Consumes: nothing from Task 1 directly (this task doesn't touch the database).
- Produces: `routes/api.php` registered under the `/api` prefix — every later task adds routes to this same file.

- [ ] **Step 1: Write the failing test**

Create `backend/tests/Feature/HealthTest.php`:

```php
<?php

namespace Tests\Feature;

use Tests\TestCase;

class HealthTest extends TestCase
{
    public function test_health_endpoint_returns_ok(): void
    {
        $this->getJson('/api/health')
            ->assertOk()
            ->assertExactJson(['ok' => true]);
    }
}
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd backend && php artisan test --filter=HealthTest`
Expected: FAIL — `404` because `/api/health` doesn't exist yet (no `routes/api.php` registered).

- [ ] **Step 3: Register the API routes file and add the health route**

In `backend/bootstrap/app.php`, change:

```php
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
```

to:

```php
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
```

Create `backend/routes/api.php`:

```php
<?php

use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json(['ok' => true]);
});
```

- [ ] **Step 4: Run the test to confirm it passes**

Run: `cd backend && php artisan test --filter=HealthTest`
Expected: PASS (1 test, 1 assertion)

- [ ] **Step 5: Remove the unused skeleton example test**

`backend/tests/Feature/ExampleTest.php` tests the default `/` welcome page — it's not touched by anything in this plan, but it's dead weight now that we have real Feature tests. Delete it:

```bash
cd backend
rm tests/Feature/ExampleTest.php
```

- [ ] **Step 6: Run the full test suite to confirm nothing broke**

Run: `cd backend && php artisan test`
Expected: PASS (1 test — `HealthTest`)

- [ ] **Step 7: Commit**

```bash
git add backend/bootstrap/app.php backend/routes/api.php backend/tests/Feature/HealthTest.php
git rm backend/tests/Feature/ExampleTest.php
git commit -m "feat(backend): register /api routes with a health check endpoint"
```

---

### Task 3: Room model + migration

**Files:**
- Create: `backend/app/Models/Room.php`
- Create: `backend/database/migrations/2026_07_08_100000_create_kostos_rooms_table.php`
- Test: `backend/tests/Feature/RoomModelTest.php`

**Interfaces:**
- Consumes: nothing.
- Produces: `App\Models\Room` — Eloquent model over `kostos_rooms`. Fields: `id` (string PK), `number`, `status`, `type`, `price` (int), `floor` (int), `size`, `facilities` (array, JSON-cast), `tenantId` (nullable string), `notes` (nullable), `lastMaintenanceDate` (nullable). No timestamps. Task 4 (RoomController) and Task 7 (tenant auto-bill) both use this model.

- [ ] **Step 1: Write the failing test**

Create `backend/tests/Feature/RoomModelTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Models\Room;
use Tests\TestCase;

class RoomModelTest extends TestCase
{
    public function test_room_can_be_created_found_and_deleted(): void
    {
        $id = 'smoke-room-'.time();

        $room = Room::create([
            'id' => $id,
            'number' => 'Z99',
            'status' => 'Kosong',
            'type' => 'Standard',
            'price' => 500000,
            'floor' => 9,
            'size' => '3x3 m',
            'facilities' => ['WiFi'],
        ]);

        $this->assertSame($id, $room->id);

        $found = Room::find($id);
        $this->assertNotNull($found);
        $this->assertSame(['WiFi'], $found->facilities);

        $found->delete();
        $this->assertNull(Room::find($id));
    }
}
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd backend && php artisan test --filter=RoomModelTest`
Expected: FAIL — `Class "App\Models\Room" not found`

- [ ] **Step 3: Create the migration (idempotent — the table already exists on the remote DB)**

Create `backend/database/migrations/2026_07_08_100000_create_kostos_rooms_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // kostos_rooms already exists (created by the Express backend, see
        // server/db.js) — this guard keeps `php artisan migrate` idempotent
        // on the shared remote database and only builds the table on a
        // genuinely fresh one.
        if (Schema::hasTable('kostos_rooms')) {
            return;
        }

        Schema::create('kostos_rooms', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->unsignedInteger('seq')->autoIncrement();
            $table->unique('seq');
            $table->string('number', 32);
            $table->string('status', 16);
            $table->string('type', 16);
            $table->integer('price')->default(0);
            $table->integer('floor')->default(1);
            $table->string('size', 32)->default('');
            $table->json('facilities')->nullable();
            $table->string('tenantId', 64)->nullable();
            $table->text('notes')->nullable();
            $table->string('lastMaintenanceDate', 32)->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kostos_rooms');
    }
};
```

- [ ] **Step 4: Create the model**

Create `backend/app/Models/Room.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Room extends Model
{
    protected $table = 'kostos_rooms';

    protected $primaryKey = 'id';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $fillable = [
        'id', 'number', 'status', 'type', 'price', 'floor', 'size',
        'facilities', 'tenantId', 'notes', 'lastMaintenanceDate',
    ];

    protected $casts = [
        'facilities' => 'array',
    ];
}
```

- [ ] **Step 5: Run the migration and the test**

Run: `cd backend && php artisan migrate`
Expected: `Nothing to migrate` won't show — it should print `DONE` for the new migration name, since `kostos_rooms` doesn't exist as a migration entry yet (even though the guard skips actual table creation because the table already exists).

Run: `php artisan test --filter=RoomModelTest`
Expected: PASS (1 test)

- [ ] **Step 6: Commit**

```bash
git add backend/app/Models/Room.php backend/database/migrations/2026_07_08_100000_create_kostos_rooms_table.php backend/tests/Feature/RoomModelTest.php
git commit -m "feat(backend): add Room model over the existing kostos_rooms table"
```

---

### Task 4: Room API (CRUD)

**Files:**
- Create: `backend/app/Http/Controllers/RoomController.php`
- Modify: `backend/routes/api.php`
- Test: `backend/tests/Feature/RoomApiTest.php`

**Interfaces:**
- Consumes: `App\Models\Room` (Task 3).
- Produces: `GET/POST /api/rooms`, `PATCH/DELETE /api/rooms/{id}` — no other task depends on this controller.

- [ ] **Step 1: Write the failing test**

Create `backend/tests/Feature/RoomApiTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Models\Room;
use Tests\TestCase;

class RoomApiTest extends TestCase
{
    public function test_room_crud_endpoints(): void
    {
        $id = 'smoke-room-'.time();

        $this->postJson('/api/rooms', [
            'id' => $id,
            'number' => 'Z98',
            'status' => 'Kosong',
            'type' => 'Standard',
            'price' => 500000,
            'floor' => 9,
            'size' => '3x3 m',
            'facilities' => ['WiFi'],
        ])->assertCreated();

        $list = $this->getJson('/api/rooms')->assertOk()->json();
        $this->assertTrue(collect($list)->contains(
            fn ($r) => $r['id'] === $id && $r['facilities'][0] === 'WiFi'
        ));

        $this->patchJson("/api/rooms/{$id}", ['status' => 'Perbaikan'])
            ->assertOk()
            ->assertJsonFragment(['status' => 'Perbaikan']);

        $this->patchJson('/api/rooms/does-not-exist', ['status' => 'Perbaikan'])
            ->assertNotFound()
            ->assertJson(['error' => 'Kamar tidak ditemukan']);

        $this->deleteJson("/api/rooms/{$id}")
            ->assertOk()
            ->assertJson(['ok' => true]);

        $this->assertNull(Room::find($id));
    }
}
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd backend && php artisan test --filter=RoomApiTest`
Expected: FAIL — `404` on `POST /api/rooms` (route doesn't exist yet)

- [ ] **Step 3: Create the controller**

Create `backend/app/Http/Controllers/RoomController.php`:

```php
<?php

namespace App\Http\Controllers;

use App\Models\Room;
use Illuminate\Http\Request;

class RoomController extends Controller
{
    public function index()
    {
        return Room::orderBy('seq')->get();
    }

    public function store(Request $request)
    {
        $room = Room::updateOrCreate(['id' => $request->input('id')], $request->all());

        return response()->json($room, 201);
    }

    public function update(Request $request, string $id)
    {
        $room = Room::find($id);

        if (! $room) {
            return response()->json(['error' => 'Kamar tidak ditemukan'], 404);
        }

        $room->fill($request->all());
        $room->save();

        return response()->json($room);
    }

    public function destroy(string $id)
    {
        Room::destroy($id);

        return response()->json(['ok' => true]);
    }
}
```

- [ ] **Step 4: Register the routes**

Append to `backend/routes/api.php`:

```php
use App\Http\Controllers\RoomController;

Route::get('/rooms', [RoomController::class, 'index']);
Route::post('/rooms', [RoomController::class, 'store']);
Route::patch('/rooms/{id}', [RoomController::class, 'update']);
Route::delete('/rooms/{id}', [RoomController::class, 'destroy']);
```

- [ ] **Step 5: Run the test to confirm it passes**

Run: `cd backend && php artisan test --filter=RoomApiTest`
Expected: PASS (1 test)

- [ ] **Step 6: Commit**

```bash
git add backend/app/Http/Controllers/RoomController.php backend/routes/api.php backend/tests/Feature/RoomApiTest.php
git commit -m "feat(backend): add Room CRUD API endpoints"
```

---

### Task 5: Tenant model + migration

**Files:**
- Create: `backend/app/Models/Tenant.php`
- Create: `backend/database/migrations/2026_07_08_100001_create_kostos_tenants_table.php`
- Test: `backend/tests/Feature/TenantModelTest.php`

**Interfaces:**
- Consumes: nothing.
- Produces: `App\Models\Tenant` — Eloquent model over `kostos_tenants`. Fields: `id` (string PK), `name`, `phone`, `email`, `emergencyContact` (array, JSON-cast), `idNumber`, `roomAssigned`, `moveInDate`, `rentAmount` (int), `deposit` (int), `status`, `notes` (nullable), `idPhotoUrl` (nullable). No timestamps. Tasks 7 and 8 use this model.

- [ ] **Step 1: Write the failing test**

Create `backend/tests/Feature/TenantModelTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Models\Tenant;
use Tests\TestCase;

class TenantModelTest extends TestCase
{
    public function test_tenant_can_be_created_found_and_deleted(): void
    {
        $id = 'smoke-tenant-'.time();

        $tenant = Tenant::create([
            'id' => $id,
            'name' => 'Smoke Tester',
            'phone' => '08123',
            'email' => 's@t.id',
            'emergencyContact' => ['name' => 'X', 'relation' => 'Y', 'phone' => '0'],
            'idNumber' => '1',
            'roomAssigned' => 'room-does-not-matter',
            'moveInDate' => '2026-07-07',
            'rentAmount' => 500000,
            'deposit' => 0,
            'status' => 'Belum Bayar',
        ]);

        $this->assertSame($id, $tenant->id);

        $found = Tenant::find($id);
        $this->assertNotNull($found);
        $this->assertSame('X', $found->emergencyContact['name']);

        $found->delete();
        $this->assertNull(Tenant::find($id));
    }
}
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd backend && php artisan test --filter=TenantModelTest`
Expected: FAIL — `Class "App\Models\Tenant" not found`

- [ ] **Step 3: Create the migration**

Create `backend/database/migrations/2026_07_08_100001_create_kostos_tenants_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // kostos_tenants already exists (created by the Express backend, see
        // server/db.js) — guard keeps this idempotent on the shared DB.
        if (Schema::hasTable('kostos_tenants')) {
            return;
        }

        Schema::create('kostos_tenants', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->unsignedInteger('seq')->autoIncrement();
            $table->unique('seq');
            $table->string('name', 191);
            $table->string('phone', 32)->default('');
            $table->string('email', 191)->default('');
            $table->json('emergencyContact')->nullable();
            $table->string('idNumber', 64)->default('');
            $table->string('roomAssigned', 64)->default('');
            $table->string('moveInDate', 32)->default('');
            $table->integer('rentAmount')->default(0);
            $table->integer('deposit')->default(0);
            $table->string('status', 16);
            $table->text('notes')->nullable();
            $table->text('idPhotoUrl')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kostos_tenants');
    }
};
```

- [ ] **Step 4: Create the model**

Create `backend/app/Models/Tenant.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tenant extends Model
{
    protected $table = 'kostos_tenants';

    protected $primaryKey = 'id';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $fillable = [
        'id', 'name', 'phone', 'email', 'emergencyContact', 'idNumber',
        'roomAssigned', 'moveInDate', 'rentAmount', 'deposit', 'status',
        'notes', 'idPhotoUrl',
    ];

    protected $casts = [
        'emergencyContact' => 'array',
    ];
}
```

- [ ] **Step 5: Run the migration and the test**

Run: `cd backend && php artisan migrate`
Expected: prints `DONE` for the new tenants migration.

Run: `php artisan test --filter=TenantModelTest`
Expected: PASS (1 test)

- [ ] **Step 6: Commit**

```bash
git add backend/app/Models/Tenant.php backend/database/migrations/2026_07_08_100001_create_kostos_tenants_table.php backend/tests/Feature/TenantModelTest.php
git commit -m "feat(backend): add Tenant model over the existing kostos_tenants table"
```

---

### Task 6: Bill + Setting models (internal — no public routes yet)

**Files:**
- Create: `backend/app/Models/Bill.php`
- Create: `backend/app/Models/Setting.php`
- Create: `backend/database/migrations/2026_07_08_100002_create_kostos_bills_table.php`
- Create: `backend/database/migrations/2026_07_08_100003_create_kostos_settings_table.php`
- Test: `backend/tests/Feature/BillAndSettingModelTest.php`

**Interfaces:**
- Consumes: nothing.
- Produces: `App\Models\Bill` — Eloquent model over `kostos_bills`, all scalar fields, string PK, no timestamps. `App\Models\Setting` — Eloquent model over `kostos_settings` (singleton row `id=1`, `data` JSON-cast to array), plus a static helper `Setting::defaultDueDateDay(): int` (falls back to `5` if no row exists). Task 7 uses both `Bill::create()` and `Setting::defaultDueDateDay()`; Task 8 uses `Bill`.

- [ ] **Step 1: Write the failing test**

Create `backend/tests/Feature/BillAndSettingModelTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Models\Bill;
use App\Models\Setting;
use Tests\TestCase;

class BillAndSettingModelTest extends TestCase
{
    public function test_bill_can_be_created_found_and_deleted(): void
    {
        $id = 'smoke-bill-'.time();

        Bill::create([
            'id' => $id,
            'tenantId' => 'smoke-tenant-x',
            'tenantName' => 'Smoke Tester',
            'roomId' => 'smoke-room-x',
            'roomNumber' => 'Z1',
            'period' => 'Juli 2026',
            'dueDate' => '2026-07-05',
            'rentAmount' => 500000,
            'electricityCharge' => 0,
            'waterCharge' => 0,
            'additionalFee' => 0,
            'discount' => 0,
            'lateFee' => 0,
            'totalAmount' => 500000,
            'paidAmount' => 0,
            'status' => 'Belum Bayar',
        ]);

        $this->assertNotNull(Bill::find($id));

        Bill::find($id)->delete();
        $this->assertNull(Bill::find($id));
    }

    public function test_setting_default_due_date_day_reads_the_existing_seeded_row(): void
    {
        // kostos_settings has one row (id=1), seeded by the Express backend —
        // this only reads it, never modifies it.
        $this->assertGreaterThan(0, Setting::defaultDueDateDay());
    }
}
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd backend && php artisan test --filter=BillAndSettingModelTest`
Expected: FAIL — `Class "App\Models\Bill" not found`

- [ ] **Step 3: Create the migrations**

Create `backend/database/migrations/2026_07_08_100002_create_kostos_bills_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // kostos_bills already exists (created by the Express backend, see
        // server/db.js) — guard keeps this idempotent on the shared DB.
        if (Schema::hasTable('kostos_bills')) {
            return;
        }

        Schema::create('kostos_bills', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->unsignedInteger('seq')->autoIncrement();
            $table->unique('seq');
            $table->string('tenantId', 64);
            $table->string('tenantName', 191)->default('');
            $table->string('roomId', 64)->default('');
            $table->string('roomNumber', 32)->default('');
            $table->string('period', 32)->default('');
            $table->string('dueDate', 32)->default('');
            $table->integer('rentAmount')->default(0);
            $table->integer('electricityCharge')->default(0);
            $table->integer('waterCharge')->default(0);
            $table->integer('additionalFee')->default(0);
            $table->integer('discount')->default(0);
            $table->integer('lateFee')->default(0);
            $table->integer('totalAmount')->default(0);
            $table->integer('paidAmount')->default(0);
            $table->string('status', 16);
            $table->string('paymentMethod', 64)->nullable();
            $table->string('paymentDate', 32)->nullable();
            $table->text('notes')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kostos_bills');
    }
};
```

Create `backend/database/migrations/2026_07_08_100003_create_kostos_settings_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // kostos_settings already exists (created by the Express backend,
        // see server/db.js) — guard keeps this idempotent on the shared DB.
        if (Schema::hasTable('kostos_settings')) {
            return;
        }

        Schema::create('kostos_settings', function (Blueprint $table) {
            $table->tinyInteger('id')->primary();
            $table->json('data');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kostos_settings');
    }
};
```

- [ ] **Step 4: Create the models**

Create `backend/app/Models/Bill.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Bill extends Model
{
    protected $table = 'kostos_bills';

    protected $primaryKey = 'id';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $fillable = [
        'id', 'tenantId', 'tenantName', 'roomId', 'roomNumber', 'period',
        'dueDate', 'rentAmount', 'electricityCharge', 'waterCharge',
        'additionalFee', 'discount', 'lateFee', 'totalAmount', 'paidAmount',
        'status', 'paymentMethod', 'paymentDate', 'notes',
    ];
}
```

Create `backend/app/Models/Setting.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $table = 'kostos_settings';

    protected $primaryKey = 'id';

    public $incrementing = false;

    protected $keyType = 'int';

    public $timestamps = false;

    protected $fillable = ['id', 'data'];

    protected $casts = [
        'data' => 'array',
    ];

    public static function defaultDueDateDay(): int
    {
        $settings = static::find(1);

        return (int) ($settings?->data['defaultDueDateDay'] ?? 5);
    }
}
```

- [ ] **Step 5: Run the migrations and the test**

Run: `cd backend && php artisan migrate`
Expected: prints `DONE` for both new migrations.

Run: `php artisan test --filter=BillAndSettingModelTest`
Expected: PASS (2 tests)

- [ ] **Step 6: Commit**

```bash
git add backend/app/Models/Bill.php backend/app/Models/Setting.php backend/database/migrations/2026_07_08_100002_create_kostos_bills_table.php backend/database/migrations/2026_07_08_100003_create_kostos_settings_table.php backend/tests/Feature/BillAndSettingModelTest.php
git commit -m "feat(backend): add internal Bill and Setting models"
```

---

### Task 7: Tenant create → flip room → auto-create first bill

**Files:**
- Create: `backend/app/Http/Controllers/TenantController.php`
- Modify: `backend/routes/api.php`
- Test: `backend/tests/Feature/TenantStoreApiTest.php`

**Interfaces:**
- Consumes: `App\Models\Tenant` (Task 5), `App\Models\Room` (Task 3), `App\Models\Bill`, `App\Models\Setting::defaultDueDateDay()` (Task 6).
- Produces: `GET/POST /api/tenants`. `TenantController` class — Task 8 adds `moveOut`/`destroy` methods to this same file.

This mirrors `handleAddTenant` in `src/App.tsx` / `server/routes/tenants.js`'s `POST /` handler exactly: save the tenant, flip the matching room to `Terisi`, auto-create one unpaid bill for the current month.

- [ ] **Step 1: Write the failing test**

Create `backend/tests/Feature/TenantStoreApiTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Models\Bill;
use App\Models\Room;
use App\Models\Tenant;
use Tests\TestCase;

class TenantStoreApiTest extends TestCase
{
    public function test_creating_tenant_flips_room_and_creates_first_bill(): void
    {
        $ts = time();
        $roomId = "smoke-room-{$ts}";
        $tenantId = "smoke-tenant-{$ts}";

        Room::create([
            'id' => $roomId,
            'number' => "Z{$ts}",
            'status' => 'Kosong',
            'type' => 'Standard',
            'price' => 500000,
            'floor' => 9,
            'size' => '3x3 m',
            'facilities' => [],
        ]);

        $this->postJson('/api/tenants', [
            'id' => $tenantId,
            'name' => 'Smoke Tester',
            'phone' => '08123',
            'email' => 's@t.id',
            'emergencyContact' => ['name' => 'X', 'relation' => 'Y', 'phone' => '0'],
            'idNumber' => '1',
            'roomAssigned' => $roomId,
            'moveInDate' => '2026-07-07',
            'rentAmount' => 500000,
            'deposit' => 0,
            'status' => 'Belum Bayar',
        ])->assertCreated();

        $room = Room::find($roomId);
        $this->assertSame('Terisi', $room->status);
        $this->assertSame($tenantId, $room->tenantId);

        $bill = Bill::where('tenantId', $tenantId)->first();
        $this->assertNotNull($bill);
        $this->assertSame(500000, $bill->totalAmount);
        $this->assertSame('Belum Bayar', $bill->status);

        // cleanup
        $bill->delete();
        Tenant::find($tenantId)->delete();
        $room->delete();
    }
}
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd backend && php artisan test --filter=TenantStoreApiTest`
Expected: FAIL — `404` on `POST /api/tenants` (route doesn't exist yet)

- [ ] **Step 3: Create the controller**

Create `backend/app/Http/Controllers/TenantController.php`:

```php
<?php

namespace App\Http\Controllers;

use App\Models\Bill;
use App\Models\Room;
use App\Models\Setting;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TenantController extends Controller
{
    private const MONTHS_ID = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ];

    public function index()
    {
        return Tenant::orderBy('seq')->get();
    }

    public function store(Request $request)
    {
        $data = $request->all();

        $tenant = DB::transaction(function () use ($data) {
            $tenant = Tenant::updateOrCreate(['id' => $data['id']], $data);

            $room = Room::where('id', $tenant->roomAssigned)
                ->orWhere('number', $tenant->roomAssigned)
                ->first();

            if ($room) {
                $room->status = 'Terisi';
                $room->tenantId = $tenant->id;
                $room->save();
            }

            $now = now();
            $rentAmount = $room ? $room->price : ($tenant->rentAmount ?? 0);
            $roomId = $room ? $room->id : '';
            $roomNumber = $room ? $room->number : ($tenant->roomAssigned ?? '');

            Bill::create([
                'id' => 'bill-auto-'.(int) round(microtime(true) * 1000),
                'tenantId' => $tenant->id,
                'tenantName' => $tenant->name,
                'roomId' => $roomId,
                'roomNumber' => $roomNumber,
                'period' => self::MONTHS_ID[$now->month - 1].' '.$now->year,
                'dueDate' => sprintf('%04d-%02d-%02d', $now->year, $now->month, Setting::defaultDueDateDay()),
                'rentAmount' => $rentAmount,
                'electricityCharge' => 0,
                'waterCharge' => 0,
                'additionalFee' => 0,
                'discount' => 0,
                'lateFee' => 0,
                'totalAmount' => $rentAmount,
                'paidAmount' => 0,
                'status' => 'Belum Bayar',
            ]);

            return $tenant;
        });

        return response()->json($tenant, 201);
    }
}
```

- [ ] **Step 4: Register the routes**

Append to `backend/routes/api.php`:

```php
use App\Http\Controllers\TenantController;

Route::get('/tenants', [TenantController::class, 'index']);
Route::post('/tenants', [TenantController::class, 'store']);
```

- [ ] **Step 5: Run the test to confirm it passes**

Run: `cd backend && php artisan test --filter=TenantStoreApiTest`
Expected: PASS (1 test)

- [ ] **Step 6: Commit**

```bash
git add backend/app/Http/Controllers/TenantController.php backend/routes/api.php backend/tests/Feature/TenantStoreApiTest.php
git commit -m "feat(backend): tenant creation flips room status and auto-creates first bill"
```

---

### Task 8: Tenant move-out + delete

**Files:**
- Modify: `backend/app/Http/Controllers/TenantController.php`
- Modify: `backend/routes/api.php`
- Test: `backend/tests/Feature/TenantMoveOutApiTest.php`

**Interfaces:**
- Consumes: `TenantController` (Task 7, same file — adds two methods), `App\Models\Tenant`, `App\Models\Room`, `App\Models\Bill`.
- Produces: `POST /api/tenants/{id}/move-out`, `DELETE /api/tenants/{id}`. Nothing later depends on this — it completes the fase-1 scope.

This mirrors `handleMoveOutTenant` in `src/App.tsx` / `server/routes/tenants.js`'s `move-out` and `DELETE /:id` handlers exactly.

- [ ] **Step 1: Write the failing test**

Create `backend/tests/Feature/TenantMoveOutApiTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Models\Bill;
use App\Models\Room;
use App\Models\Tenant;
use Tests\TestCase;

class TenantMoveOutApiTest extends TestCase
{
    public function test_move_out_drops_unpaid_bills_frees_room_and_deletes_tenant(): void
    {
        $ts = time();
        $roomId = "smoke-room-{$ts}";
        $tenantId = "smoke-tenant-{$ts}";
        $paidBillId = "smoke-bill-paid-{$ts}";
        $unpaidBillId = "smoke-bill-unpaid-{$ts}";

        Room::create([
            'id' => $roomId, 'number' => "Z{$ts}", 'status' => 'Terisi',
            'type' => 'Standard', 'price' => 500000, 'floor' => 9, 'size' => '3x3 m',
            'facilities' => [], 'tenantId' => $tenantId,
        ]);

        Tenant::create([
            'id' => $tenantId, 'name' => 'Smoke Tester', 'phone' => '08123',
            'email' => 's@t.id', 'emergencyContact' => ['name' => 'X', 'relation' => 'Y', 'phone' => '0'],
            'idNumber' => '1', 'roomAssigned' => $roomId, 'moveInDate' => '2026-07-07',
            'rentAmount' => 500000, 'deposit' => 0, 'status' => 'Lunas',
        ]);

        $billAttrs = [
            'tenantId' => $tenantId, 'tenantName' => 'Smoke Tester', 'roomId' => $roomId,
            'roomNumber' => "Z{$ts}", 'period' => 'Juli 2026', 'dueDate' => '2026-07-05',
            'rentAmount' => 500000, 'electricityCharge' => 0, 'waterCharge' => 0,
            'additionalFee' => 0, 'discount' => 0, 'lateFee' => 0,
            'totalAmount' => 500000, 'paidAmount' => 0,
        ];
        Bill::create(['id' => $paidBillId, 'status' => 'Lunas'] + $billAttrs);
        Bill::create(['id' => $unpaidBillId, 'status' => 'Belum Bayar'] + $billAttrs);

        $this->postJson("/api/tenants/{$tenantId}/move-out")
            ->assertOk()
            ->assertJson(['ok' => true]);

        $this->assertNull(Tenant::find($tenantId));
        $this->assertNull(Bill::find($unpaidBillId));
        $this->assertNotNull(Bill::find($paidBillId));

        $room = Room::find($roomId);
        $this->assertSame('Kosong', $room->status);
        $this->assertNull($room->tenantId);

        $this->postJson('/api/tenants/does-not-exist/move-out')
            ->assertNotFound()
            ->assertJson(['error' => 'Penghuni tidak ditemukan']);

        // cleanup
        Bill::find($paidBillId)->delete();
        $room->delete();
    }

    public function test_destroy_deletes_tenant_without_side_effects(): void
    {
        $ts = time();
        $tenantId = "smoke-tenant-destroy-{$ts}";

        Tenant::create([
            'id' => $tenantId, 'name' => 'Smoke Tester', 'phone' => '08123',
            'email' => 's@t.id', 'emergencyContact' => ['name' => 'X', 'relation' => 'Y', 'phone' => '0'],
            'idNumber' => '1', 'roomAssigned' => 'none', 'moveInDate' => '2026-07-07',
            'rentAmount' => 0, 'deposit' => 0, 'status' => 'Lunas',
        ]);

        $this->deleteJson("/api/tenants/{$tenantId}")
            ->assertOk()
            ->assertJson(['ok' => true]);

        $this->assertNull(Tenant::find($tenantId));
    }
}
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd backend && php artisan test --filter=TenantMoveOutApiTest`
Expected: FAIL — `404` on `POST /api/tenants/{id}/move-out` (route doesn't exist yet)

- [ ] **Step 3: Add the two methods to the controller**

Add these two methods inside `App\Http\Controllers\TenantController` (in `backend/app/Http/Controllers/TenantController.php`, after `store`):

```php
    public function moveOut(string $id)
    {
        $tenant = Tenant::find($id);

        if (! $tenant) {
            return response()->json(['error' => 'Penghuni tidak ditemukan'], 404);
        }

        DB::transaction(function () use ($tenant) {
            Bill::where('tenantId', $tenant->id)->where('status', '!=', 'Lunas')->delete();

            Room::where('tenantId', $tenant->id)
                ->orWhere('number', $tenant->roomAssigned)
                ->orWhere('id', $tenant->roomAssigned)
                ->update(['status' => 'Kosong', 'tenantId' => null]);

            $tenant->delete();
        });

        return response()->json(['ok' => true]);
    }

    public function destroy(string $id)
    {
        Tenant::destroy($id);

        return response()->json(['ok' => true]);
    }
```

- [ ] **Step 4: Register the routes**

Append to `backend/routes/api.php`:

```php
Route::post('/tenants/{id}/move-out', [TenantController::class, 'moveOut']);
Route::delete('/tenants/{id}', [TenantController::class, 'destroy']);
```

- [ ] **Step 5: Run the test to confirm it passes**

Run: `cd backend && php artisan test --filter=TenantMoveOutApiTest`
Expected: PASS (2 tests)

- [ ] **Step 6: Run the full suite one last time**

Run: `cd backend && php artisan test`
Expected: PASS (all tests across every task in this plan)

- [ ] **Step 7: Commit**

```bash
git add backend/app/Http/Controllers/TenantController.php backend/routes/api.php backend/tests/Feature/TenantMoveOutApiTest.php
git commit -m "feat(backend): tenant move-out drops unpaid bills and frees the room"
```

---

## After this plan

Fase 1 scope (per `docs/superpowers/specs/2026-07-08-laravel-backend-mysql-design.md`) is complete: Laravel runs standalone (`php artisan serve`) against the shared remote MySQL, with rooms + tenants fully covered including the cross-entity business rules. Next steps (separate future plans, not part of this one): `BillController`/`ExpenseController`/`ComplaintController`/`SettingController` following the same pattern, then switching the Vite dev proxy from Express to Laravel, then deprecating `server/`.
