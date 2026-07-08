# Laravel Backend Fase 2 (Bills, Expenses, Complaints, Settings, Restore) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Prerequisite:** Fase 1 (`docs/superpowers/plans/2026-07-08-laravel-backend-mysql.md`, Tasks 1-8) must already be complete and merged into this branch — this plan reuses `Room`, `Tenant`, `Bill`, `Setting` models and the `routes/api.php` file it created.

**Goal:** Complete Laravel API parity with Express (`server/`) by adding `bills`, `expenses`, `complaints`, and `settings` endpoints plus the `restore` full-replace endpoint, then switch the frontend's dev proxy from Express to Laravel.

**Architecture:** Same as Fase 1 — Eloquent models over existing `kostos_*` tables (string PK, no timestamps, camelCase columns), thin controllers under `routes/api.php`, no auth, no request validation, business rules wrapped in `DB::transaction()`.

**Tech Stack:** PHP 8.2, Laravel 12, MySQL (remote, Hostinger hPanel), PHPUnit.

## Global Constraints

- All application tables are prefixed `kostos_` — never create or touch a non-`kostos_`-prefixed table (shared hPanel database).
- Never run `migrate:fresh`, `migrate:refresh`, or use `RefreshDatabase`/`DatabaseMigrations` test traits.
- No request validation layer (FormRequest) — mirrors Express, which doesn't validate bodies either.
- No auth/Sanctum in this phase.
- Every Feature test that writes data uses an id prefixed `smoke-` and explicitly deletes everything it created before the test ends — **except** the Restore test (Task 14), which follows the special snapshot/restore-back protocol in that task because it is the one endpoint that wipes all rows.
- `server/` (Express) is not deleted in this phase — it stays as a rollback path.

---

### Task 9: Expense model + migration

**Files:**
- Create: `backend/app/Models/Expense.php`
- Create: `backend/database/migrations/2026_07_08_100004_create_kostos_expenses_table.php`
- Test: `backend/tests/Feature/ExpenseModelTest.php`

**Interfaces:**
- Consumes: nothing.
- Produces: `App\Models\Expense` — Eloquent model over `kostos_expenses`. Fields: `id` (string PK), `category`, `description`, `date`, `amount` (int), `notes` (nullable). No timestamps. Task 10 (ExpenseController) uses this model.

- [ ] **Step 1: Write the failing test**

Create `backend/tests/Feature/ExpenseModelTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Models\Expense;
use Tests\TestCase;

class ExpenseModelTest extends TestCase
{
    public function test_expense_can_be_created_found_and_deleted(): void
    {
        $id = 'smoke-exp-'.time();

        Expense::create([
            'id' => $id,
            'category' => 'Lainnya',
            'description' => 'smoke',
            'date' => '2026-07-08',
            'amount' => 1000,
        ]);

        $this->assertNotNull(Expense::find($id));

        Expense::find($id)->delete();
        $this->assertNull(Expense::find($id));
    }
}
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd backend && php artisan test --filter=ExpenseModelTest`
Expected: FAIL — `Class "App\Models\Expense" not found`

- [ ] **Step 3: Create the migration**

Create `backend/database/migrations/2026_07_08_100004_create_kostos_expenses_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // kostos_expenses already exists (created by the Express backend,
        // see server/db.js) — guard keeps this idempotent on the shared DB.
        if (Schema::hasTable('kostos_expenses')) {
            return;
        }

        Schema::create('kostos_expenses', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->unsignedInteger('seq')->autoIncrement();
            $table->unique('seq');
            $table->string('category', 32);
            $table->text('description');
            $table->string('date', 32)->default('');
            $table->integer('amount')->default(0);
            $table->text('notes')->nullable();
        });
    }

    public function down(): void
    {
        // No-op: this migration never truly "owns" table creation on the
        // shared remote DB (up() already skips creation when the table
        // pre-exists), so rollback must never drop the real kostos_expenses
        // table and its live data.
    }
};
```

- [ ] **Step 4: Create the model**

Create `backend/app/Models/Expense.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    protected $table = 'kostos_expenses';

    protected $primaryKey = 'id';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $fillable = ['id', 'category', 'description', 'date', 'amount', 'notes'];
}
```

- [ ] **Step 5: Run the migration and the test**

Run: `cd backend && php artisan migrate`
Expected: prints `DONE` for the new migration.

Run: `php artisan test --filter=ExpenseModelTest`
Expected: PASS (1 test)

- [ ] **Step 6: Commit**

```bash
git add backend/app/Models/Expense.php backend/database/migrations/2026_07_08_100004_create_kostos_expenses_table.php backend/tests/Feature/ExpenseModelTest.php
git commit -m "feat(backend): add Expense model over the existing kostos_expenses table"
```

---

### Task 10: Expense API (CRUD)

**Files:**
- Create: `backend/app/Http/Controllers/ExpenseController.php`
- Modify: `backend/routes/api.php`
- Test: `backend/tests/Feature/ExpenseApiTest.php`

**Interfaces:**
- Consumes: `App\Models\Expense` (Task 9).
- Produces: `GET/POST /api/expenses`, `DELETE /api/expenses/{id}`.

- [ ] **Step 1: Write the failing test**

Create `backend/tests/Feature/ExpenseApiTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Models\Expense;
use Tests\TestCase;

class ExpenseApiTest extends TestCase
{
    public function test_expense_crud_endpoints(): void
    {
        $id = 'smoke-exp-'.time();

        $this->postJson('/api/expenses', [
            'id' => $id,
            'category' => 'Lainnya',
            'description' => 'smoke',
            'date' => '2026-07-08',
            'amount' => 1000,
        ])->assertCreated();

        $list = $this->getJson('/api/expenses')->assertOk()->json();
        $this->assertTrue(collect($list)->contains(fn ($e) => $e['id'] === $id));

        $this->deleteJson("/api/expenses/{$id}")
            ->assertOk()
            ->assertJson(['ok' => true]);

        $this->assertNull(Expense::find($id));
    }
}
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd backend && php artisan test --filter=ExpenseApiTest`
Expected: FAIL — `404` on `POST /api/expenses`

- [ ] **Step 3: Create the controller**

Create `backend/app/Http/Controllers/ExpenseController.php`:

```php
<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    public function index()
    {
        return Expense::orderBy('seq', 'desc')->get();
    }

    public function store(Request $request)
    {
        $expense = Expense::updateOrCreate(['id' => $request->input('id')], $request->all());

        return response()->json($expense, 201);
    }

    public function destroy(string $id)
    {
        Expense::destroy($id);

        return response()->json(['ok' => true]);
    }
}
```

- [ ] **Step 4: Register the routes**

Append to `backend/routes/api.php`:

```php
use App\Http\Controllers\ExpenseController;

Route::get('/expenses', [ExpenseController::class, 'index']);
Route::post('/expenses', [ExpenseController::class, 'store']);
Route::delete('/expenses/{id}', [ExpenseController::class, 'destroy']);
```

- [ ] **Step 5: Run the test to confirm it passes**

Run: `cd backend && php artisan test --filter=ExpenseApiTest`
Expected: PASS (1 test)

- [ ] **Step 6: Commit**

```bash
git add backend/app/Http/Controllers/ExpenseController.php backend/routes/api.php backend/tests/Feature/ExpenseApiTest.php
git commit -m "feat(backend): add Expense CRUD API endpoints"
```

---

### Task 11: Complaint model + migration

**Files:**
- Create: `backend/app/Models/Complaint.php`
- Create: `backend/database/migrations/2026_07_08_100005_create_kostos_complaints_table.php`
- Test: `backend/tests/Feature/ComplaintModelTest.php`

**Interfaces:**
- Consumes: nothing.
- Produces: `App\Models\Complaint` — Eloquent model over `kostos_complaints`. Fields: `id` (string PK), `tenantId`, `tenantName`, `roomId`, `roomNumber`, `title`, `category`, `status`, `priority`, `date`, `description`, `repairCost` (nullable int), `notes` (nullable). No timestamps. Task 12 (ComplaintController) uses this model.

- [ ] **Step 1: Write the failing test**

Create `backend/tests/Feature/ComplaintModelTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Models\Complaint;
use Tests\TestCase;

class ComplaintModelTest extends TestCase
{
    public function test_complaint_can_be_created_found_and_deleted(): void
    {
        $id = 'smoke-comp-'.time();

        Complaint::create([
            'id' => $id,
            'tenantId' => 'smoke-tenant-x',
            'tenantName' => 'Smoke Tester',
            'roomId' => 'smoke-room-x',
            'roomNumber' => 'Z1',
            'title' => 'smoke',
            'category' => 'Lainnya',
            'status' => 'Baru',
            'priority' => 'Rendah',
            'date' => '2026-07-08',
            'description' => 'smoke',
        ]);

        $this->assertNotNull(Complaint::find($id));

        Complaint::find($id)->delete();
        $this->assertNull(Complaint::find($id));
    }
}
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd backend && php artisan test --filter=ComplaintModelTest`
Expected: FAIL — `Class "App\Models\Complaint" not found`

- [ ] **Step 3: Create the migration**

Create `backend/database/migrations/2026_07_08_100005_create_kostos_complaints_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // kostos_complaints already exists (created by the Express backend,
        // see server/db.js) — guard keeps this idempotent on the shared DB.
        if (Schema::hasTable('kostos_complaints')) {
            return;
        }

        Schema::create('kostos_complaints', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->unsignedInteger('seq')->autoIncrement();
            $table->unique('seq');
            $table->string('tenantId', 64)->default('');
            $table->string('tenantName', 191)->default('');
            $table->string('roomId', 64)->default('');
            $table->string('roomNumber', 32)->default('');
            $table->text('title');
            $table->string('category', 32);
            $table->string('status', 16);
            $table->string('priority', 16);
            $table->string('date', 32)->default('');
            $table->text('description');
            $table->integer('repairCost')->nullable();
            $table->text('notes')->nullable();
        });
    }

    public function down(): void
    {
        // No-op: this migration never truly "owns" table creation on the
        // shared remote DB (up() already skips creation when the table
        // pre-exists), so rollback must never drop the real kostos_complaints
        // table and its live data.
    }
};
```

- [ ] **Step 4: Create the model**

Create `backend/app/Models/Complaint.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Complaint extends Model
{
    protected $table = 'kostos_complaints';

    protected $primaryKey = 'id';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $fillable = [
        'id', 'tenantId', 'tenantName', 'roomId', 'roomNumber', 'title',
        'category', 'status', 'priority', 'date', 'description',
        'repairCost', 'notes',
    ];
}
```

- [ ] **Step 5: Run the migration and the test**

Run: `cd backend && php artisan migrate`
Expected: prints `DONE` for the new migration.

Run: `php artisan test --filter=ComplaintModelTest`
Expected: PASS (1 test)

- [ ] **Step 6: Commit**

```bash
git add backend/app/Models/Complaint.php backend/database/migrations/2026_07_08_100005_create_kostos_complaints_table.php backend/tests/Feature/ComplaintModelTest.php
git commit -m "feat(backend): add Complaint model over the existing kostos_complaints table"
```

---

### Task 12: Complaint API (index, store, update, destroy)

**Files:**
- Create: `backend/app/Http/Controllers/ComplaintController.php`
- Modify: `backend/routes/api.php`
- Test: `backend/tests/Feature/ComplaintApiTest.php`

**Interfaces:**
- Consumes: `App\Models\Complaint` (Task 11), `App\Models\Expense` (Task 9, only to assert it's NOT touched).
- Produces: `GET/POST /api/complaints`, `PATCH/DELETE /api/complaints/{id}`.

- [ ] **Step 1: Write the failing test**

Create `backend/tests/Feature/ComplaintApiTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Models\Complaint;
use App\Models\Expense;
use Tests\TestCase;

class ComplaintApiTest extends TestCase
{
    public function test_complaint_crud_and_patch_does_not_auto_create_expense(): void
    {
        $id = 'smoke-comp-'.time();

        $this->postJson('/api/complaints', [
            'id' => $id,
            'tenantId' => 'smoke-tenant-x',
            'tenantName' => 'Smoke Tester',
            'roomId' => 'smoke-room-x',
            'roomNumber' => 'Z1',
            'title' => 'smoke',
            'category' => 'Lainnya',
            'status' => 'Baru',
            'priority' => 'Rendah',
            'date' => '2026-07-08',
            'description' => 'smoke',
        ])->assertCreated();

        $expenseCountBefore = Expense::count();

        $this->patchJson("/api/complaints/{$id}", [
            'status' => 'Selesai',
            'repairCost' => 5000,
        ])
            ->assertOk()
            ->assertJsonFragment(['status' => 'Selesai', 'repairCost' => 5000]);

        // unrelated field from the original create must survive the partial merge
        $updated = Complaint::find($id);
        $this->assertSame('smoke', $updated->title);
        $this->assertSame($expenseCountBefore, Expense::count());

        $this->patchJson('/api/complaints/does-not-exist', ['status' => 'Selesai'])
            ->assertNotFound()
            ->assertJson(['error' => 'Komplain tidak ditemukan']);

        $this->deleteJson("/api/complaints/{$id}")
            ->assertOk()
            ->assertJson(['ok' => true]);

        $this->assertNull(Complaint::find($id));
    }
}
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd backend && php artisan test --filter=ComplaintApiTest`
Expected: FAIL — `404` on `POST /api/complaints`

- [ ] **Step 3: Create the controller**

Create `backend/app/Http/Controllers/ComplaintController.php`:

```php
<?php

namespace App\Http\Controllers;

use App\Models\Complaint;
use Illuminate\Http\Request;

class ComplaintController extends Controller
{
    public function index()
    {
        return Complaint::orderBy('seq', 'desc')->get();
    }

    public function store(Request $request)
    {
        $complaint = Complaint::updateOrCreate(['id' => $request->input('id')], $request->all());

        return response()->json($complaint, 201);
    }

    // Merges only the fields sent. Never creates an Expense here even when
    // status becomes 'Selesai' with a repairCost — the client syncs that
    // repair expense itself via a separate POST /api/expenses call.
    public function update(Request $request, string $id)
    {
        $complaint = Complaint::find($id);

        if (! $complaint) {
            return response()->json(['error' => 'Komplain tidak ditemukan'], 404);
        }

        foreach ($request->all() as $key => $value) {
            if ($value !== null) {
                $complaint->{$key} = $value;
            }
        }

        $complaint->save();

        return response()->json($complaint);
    }

    public function destroy(string $id)
    {
        Complaint::destroy($id);

        return response()->json(['ok' => true]);
    }
}
```

- [ ] **Step 4: Register the routes**

Append to `backend/routes/api.php`:

```php
use App\Http\Controllers\ComplaintController;

Route::get('/complaints', [ComplaintController::class, 'index']);
Route::post('/complaints', [ComplaintController::class, 'store']);
Route::patch('/complaints/{id}', [ComplaintController::class, 'update']);
Route::delete('/complaints/{id}', [ComplaintController::class, 'destroy']);
```

- [ ] **Step 5: Run the test to confirm it passes**

Run: `cd backend && php artisan test --filter=ComplaintApiTest`
Expected: PASS (1 test)

- [ ] **Step 6: Commit**

```bash
git add backend/app/Http/Controllers/ComplaintController.php backend/routes/api.php backend/tests/Feature/ComplaintApiTest.php
git commit -m "feat(backend): add Complaint API (patch never auto-creates an expense)"
```

---

### Task 13: Bill API (index, store, payments, destroy)

**Files:**
- Create: `backend/app/Http/Controllers/BillController.php`
- Modify: `backend/routes/api.php`
- Test: `backend/tests/Feature/BillApiTest.php`

**Interfaces:**
- Consumes: `App\Models\Bill` (Fase 1 Task 6), `App\Models\Tenant` (Fase 1 Task 5), `App\Models\Room` (Fase 1 Task 3).
- Produces: `GET/POST /api/bills`, `POST /api/bills/{id}/payments`, `DELETE /api/bills/{id}`.

- [ ] **Step 1: Write the failing test**

Create `backend/tests/Feature/BillApiTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Models\Bill;
use App\Models\Room;
use App\Models\Tenant;
use Tests\TestCase;

class BillApiTest extends TestCase
{
    public function test_bill_store_flips_tenant_and_room_then_payment_reaches_lunas(): void
    {
        $ts = time();
        $roomId = "smoke-room-{$ts}";
        $roomNumber = "Z{$ts}";
        $tenantId = "smoke-tenant-{$ts}";
        $billId = "smoke-bill-{$ts}";

        Room::create([
            'id' => $roomId, 'number' => $roomNumber, 'status' => 'Kosong',
            'type' => 'Standard', 'price' => 500000, 'floor' => 9, 'size' => '3x3 m',
            'facilities' => [],
        ]);

        Tenant::create([
            'id' => $tenantId, 'name' => 'Smoke Tester', 'phone' => '08123',
            'email' => 's@t.id', 'emergencyContact' => ['name' => 'X', 'relation' => 'Y', 'phone' => '0'],
            'idNumber' => '1', 'roomAssigned' => $roomId, 'moveInDate' => '2026-07-08',
            'rentAmount' => 500000, 'deposit' => 0, 'status' => 'Terlambat',
        ]);

        $this->postJson('/api/bills', [
            'id' => $billId, 'tenantId' => $tenantId, 'tenantName' => 'Smoke Tester',
            'roomId' => $roomId, 'roomNumber' => $roomNumber, 'period' => 'Juli 2026',
            'dueDate' => '2026-07-05', 'rentAmount' => 500000, 'electricityCharge' => 0,
            'waterCharge' => 0, 'additionalFee' => 0, 'discount' => 0, 'lateFee' => 0,
            'totalAmount' => 500000, 'paidAmount' => 0, 'status' => 'Belum Bayar',
        ])->assertCreated();

        $this->assertSame('Belum Bayar', Tenant::find($tenantId)->status);
        $this->assertSame('Terisi', Room::find($roomId)->status);

        $this->postJson("/api/bills/{$billId}/payments", [
            'amountPaid' => 500000, 'method' => 'Tunai', 'date' => '2026-07-08',
        ])
            ->assertOk()
            ->assertJsonFragment(['status' => 'Lunas', 'paidAmount' => 500000]);

        $this->assertSame('Lunas', Tenant::find($tenantId)->status);

        $this->postJson('/api/bills/does-not-exist/payments', ['amountPaid' => 1000])
            ->assertNotFound()
            ->assertJson(['error' => 'Tagihan tidak ditemukan']);

        $this->deleteJson("/api/bills/{$billId}")
            ->assertOk()
            ->assertJson(['ok' => true]);

        // cleanup
        Tenant::find($tenantId)->delete();
        Room::find($roomId)->delete();
    }
}
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd backend && php artisan test --filter=BillApiTest`
Expected: FAIL — `404` on `POST /api/bills`

- [ ] **Step 3: Create the controller**

Create `backend/app/Http/Controllers/BillController.php`:

```php
<?php

namespace App\Http\Controllers;

use App\Models\Bill;
use App\Models\Room;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BillController extends Controller
{
    public function index()
    {
        return Bill::orderBy('seq', 'desc')->get();
    }

    public function store(Request $request)
    {
        $data = $request->all();

        $bill = DB::transaction(function () use ($data) {
            $bill = Bill::updateOrCreate(['id' => $data['id']], $data);

            Tenant::where('id', $bill->tenantId)->update(['status' => 'Belum Bayar']);
            Room::where('number', $bill->roomNumber)->update(['status' => 'Terisi']);

            return $bill;
        });

        return response()->json($bill, 201);
    }

    public function payments(Request $request, string $id)
    {
        $bill = Bill::find($id);

        if (! $bill) {
            return response()->json(['error' => 'Tagihan tidak ditemukan'], 404);
        }

        $amountPaid = (int) $request->input('amountPaid', 0);
        $nextPaid = $bill->paidAmount + $amountPaid;
        $reachedLunas = $nextPaid >= $bill->totalAmount;

        DB::transaction(function () use ($request, $bill, $nextPaid, $reachedLunas) {
            $bill->paidAmount = $nextPaid;
            $bill->status = $reachedLunas ? 'Lunas' : 'Sebagian';
            $bill->paymentMethod = $request->input('method');
            $bill->paymentDate = $request->input('date');
            $bill->notes = $request->input('notes') ?: $bill->notes;
            $bill->save();

            if ($reachedLunas) {
                Tenant::where('id', $bill->tenantId)->update(['status' => 'Lunas']);
                Room::where('number', $bill->roomNumber)->update(['status' => 'Terisi']);
            }
        });

        return response()->json($bill);
    }

    public function destroy(string $id)
    {
        Bill::destroy($id);

        return response()->json(['ok' => true]);
    }
}
```

- [ ] **Step 4: Register the routes**

Append to `backend/routes/api.php`:

```php
use App\Http\Controllers\BillController;

Route::get('/bills', [BillController::class, 'index']);
Route::post('/bills', [BillController::class, 'store']);
Route::post('/bills/{id}/payments', [BillController::class, 'payments']);
Route::delete('/bills/{id}', [BillController::class, 'destroy']);
```

- [ ] **Step 5: Run the test to confirm it passes**

Run: `cd backend && php artisan test --filter=BillApiTest`
Expected: PASS (1 test)

- [ ] **Step 6: Commit**

```bash
git add backend/app/Http/Controllers/BillController.php backend/routes/api.php backend/tests/Feature/BillApiTest.php
git commit -m "feat(backend): add Bill API with payment recording business rule"
```

---

### Task 14: Settings API (index, update)

**Files:**
- Create: `backend/app/Http/Controllers/SettingController.php`
- Modify: `backend/routes/api.php`
- Test: `backend/tests/Feature/SettingApiTest.php`

**Interfaces:**
- Consumes: `App\Models\Setting` (Fase 1 Task 6).
- Produces: `GET/PUT /api/settings`.

- [ ] **Step 1: Write the failing test**

Create `backend/tests/Feature/SettingApiTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Models\Setting;
use Tests\TestCase;

class SettingApiTest extends TestCase
{
    public function test_get_settings_returns_existing_data_and_put_updates_it(): void
    {
        $original = Setting::find(1)->data;

        $get = $this->getJson('/api/settings')->assertOk()->json();
        $this->assertSame($original['kostName'], $get['kostName']);

        $updated = $original;
        $updated['reminderTemplate'] = 'smoke-template-'.time();

        $this->putJson('/api/settings', $updated)
            ->assertOk()
            ->assertJsonFragment(['reminderTemplate' => $updated['reminderTemplate']]);

        $this->assertSame($updated['reminderTemplate'], Setting::find(1)->data['reminderTemplate']);

        // restore the original reminderTemplate so this test doesn't leave
        // real settings mutated
        $this->putJson('/api/settings', $original);
        $this->assertSame($original['reminderTemplate'], Setting::find(1)->data['reminderTemplate']);
    }
}
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd backend && php artisan test --filter=SettingApiTest`
Expected: FAIL — `404` on `GET /api/settings`

- [ ] **Step 3: Create the controller**

Create `backend/app/Http/Controllers/SettingController.php`:

```php
<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index()
    {
        $settings = Setting::find(1);

        return response()->json($settings->data ?? []);
    }

    public function update(Request $request)
    {
        Setting::updateOrCreate(['id' => 1], ['data' => $request->all()]);

        return response()->json($request->all());
    }
}
```

- [ ] **Step 4: Register the routes**

Append to `backend/routes/api.php`:

```php
use App\Http\Controllers\SettingController;

Route::get('/settings', [SettingController::class, 'index']);
Route::put('/settings', [SettingController::class, 'update']);
```

- [ ] **Step 5: Run the test to confirm it passes**

Run: `cd backend && php artisan test --filter=SettingApiTest`
Expected: PASS (1 test)

- [ ] **Step 6: Commit**

```bash
git add backend/app/Http/Controllers/SettingController.php backend/routes/api.php backend/tests/Feature/SettingApiTest.php
git commit -m "feat(backend): add Settings API"
```

---

### Task 15: Restore API (full wipe + replace) — special safety protocol

**Files:**
- Create: `backend/app/Http/Controllers/RestoreController.php`
- Modify: `backend/routes/api.php`
- Test: `backend/tests/Feature/RestoreApiTest.php`

**Interfaces:**
- Consumes: `App\Models\Room`, `App\Models\Tenant`, `App\Models\Bill`, `App\Models\Expense`, `App\Models\Complaint`, `App\Models\Setting` (all prior tasks).
- Produces: `POST /api/restore`. Nothing later depends on this controller.

**This is the one endpoint that deletes every row in every `kostos_*` table.** Its test follows the safety protocol from `docs/superpowers/specs/2026-07-08-laravel-backend-mysql-fase2-design.md` §6: snapshot the real data first, run the destructive call with `smoke-*` data, assert, then **unconditionally restore the snapshot in a `finally` block** — this must run even if an earlier assertion in the test fails, or a test failure would permanently wipe the real kost data down to test rows.

- [ ] **Step 1: Write the failing test**

Create `backend/tests/Feature/RestoreApiTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Models\Bill;
use App\Models\Complaint;
use App\Models\Expense;
use App\Models\Room;
use App\Models\Setting;
use App\Models\Tenant;
use Tests\TestCase;

class RestoreApiTest extends TestCase
{
    public function test_restore_replaces_all_data_and_is_restored_back_afterward(): void
    {
        // Snapshot real data BEFORE anything else runs.
        $snapshot = [
            'kostSettings' => Setting::find(1)->data,
            'rooms' => Room::orderBy('seq')->get()->toArray(),
            'tenants' => Tenant::orderBy('seq')->get()->toArray(),
            'bills' => Bill::orderBy('seq')->get()->toArray(),
            'expenses' => Expense::orderBy('seq')->get()->toArray(),
            'complaints' => Complaint::orderBy('seq')->get()->toArray(),
        ];

        $ts = time();

        try {
            $smokePayload = [
                'kostSettings' => $snapshot['kostSettings'],
                'rooms' => [[
                    'id' => "smoke-room-{$ts}", 'number' => "Z{$ts}", 'status' => 'Kosong',
                    'type' => 'Standard', 'price' => 500000, 'floor' => 9, 'size' => '3x3 m',
                    'facilities' => [],
                ]],
                'tenants' => [],
                'bills' => [],
                'expenses' => [[
                    'id' => "smoke-exp-{$ts}", 'category' => 'Lainnya',
                    'description' => 'smoke', 'date' => '2026-07-08', 'amount' => 1000,
                ]],
                'complaints' => [],
            ];

            $this->postJson('/api/restore', $smokePayload)
                ->assertOk()
                ->assertJson(['ok' => true]);

            $this->assertCount(1, Room::all());
            $this->assertSame("smoke-room-{$ts}", Room::first()->id);
            $this->assertCount(0, Tenant::all());
            $this->assertCount(0, Bill::all());
            $this->assertCount(1, Expense::all());
            $this->assertCount(0, Complaint::all());
        } finally {
            // ALWAYS restore the real snapshot, even if an assertion above failed.
            $this->postJson('/api/restore', $snapshot);
        }

        $this->assertCount(count($snapshot['rooms']), Room::all());
        $this->assertCount(count($snapshot['tenants']), Tenant::all());
        $this->assertCount(count($snapshot['bills']), Bill::all());
        $this->assertCount(count($snapshot['expenses']), Expense::all());
        $this->assertCount(count($snapshot['complaints']), Complaint::all());
        $this->assertSame($snapshot['kostSettings']['kostName'], Setting::find(1)->data['kostName']);
    }

    public function test_restore_requires_kost_settings(): void
    {
        $this->postJson('/api/restore', ['rooms' => []])
            ->assertStatus(400)
            ->assertJson(['error' => 'kostSettings wajib ada']);
    }
}
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd backend && php artisan test --filter=RestoreApiTest`
Expected: FAIL — `404` on `POST /api/restore`

- [ ] **Step 3: Create the controller**

Create `backend/app/Http/Controllers/RestoreController.php`:

```php
<?php

namespace App\Http\Controllers;

use App\Models\Bill;
use App\Models\Complaint;
use App\Models\Expense;
use App\Models\Room;
use App\Models\Setting;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RestoreController extends Controller
{
    public function store(Request $request)
    {
        if (! $request->has('kostSettings')) {
            return response()->json(['error' => 'kostSettings wajib ada'], 400);
        }

        DB::transaction(function () use ($request) {
            Bill::query()->delete();
            Complaint::query()->delete();
            Expense::query()->delete();
            Tenant::query()->delete();
            Room::query()->delete();

            Setting::updateOrCreate(['id' => 1], ['data' => $request->input('kostSettings')]);

            foreach ($request->input('rooms', []) as $room) {
                Room::create($room);
            }
            foreach ($request->input('tenants', []) as $tenant) {
                Tenant::create($tenant);
            }
            foreach ($request->input('bills', []) as $bill) {
                Bill::create($bill);
            }
            foreach ($request->input('expenses', []) as $expense) {
                Expense::create($expense);
            }
            foreach ($request->input('complaints', []) as $complaint) {
                Complaint::create($complaint);
            }
        });

        return response()->json(['ok' => true]);
    }
}
```

- [ ] **Step 4: Register the route**

Append to `backend/routes/api.php`:

```php
use App\Http\Controllers\RestoreController;

Route::post('/restore', [RestoreController::class, 'store']);
```

- [ ] **Step 5: Run the test to confirm it passes**

Run: `cd backend && php artisan test --filter=RestoreApiTest`
Expected: PASS (2 tests). Manually re-check afterward: `php artisan tinker --execute="echo App\Models\Room::count();"` should print the same room count as before this task started (confirms the snapshot restore-back genuinely worked, not just that the test asserted it did).

- [ ] **Step 6: Run the full test suite**

Run: `cd backend && php artisan test`
Expected: PASS (every test from Fase 1 Task 1 through this task)

- [ ] **Step 7: Commit**

```bash
git add backend/app/Http/Controllers/RestoreController.php backend/routes/api.php backend/tests/Feature/RestoreApiTest.php
git commit -m "feat(backend): add Restore API (full wipe + replace, snapshot-tested)"
```

---

### Task 16: Switch frontend dev proxy from Express to Laravel

**Files:**
- Modify: `vite.config.ts:20-22`

**Interfaces:**
- Consumes: every endpoint built in Fase 1 + Fase 2 (this is the integration point where the real frontend starts exercising all of them together).
- Produces: nothing further depends on this — it's the last task in this plan.

This task has no automated test — it's a manual verification against the real running app, because it's the point where the actual React frontend (not a PHPUnit Feature test) starts talking to Laravel.

- [ ] **Step 1: Change the proxy target**

In `vite.config.ts`, change:

```ts
      proxy: {
        '/api': 'http://localhost:3001',
      },
```

to:

```ts
      proxy: {
        '/api': 'http://localhost:8000',
      },
```

- [ ] **Step 2: Start both servers**

In one terminal:

```bash
cd backend
php artisan serve
```

Expected: `INFO  Server running on [http://127.0.0.1:8000].`

In another terminal, from the repo root:

```bash
npm run dev
```

Expected: Vite dev server starts on port 3000.

- [ ] **Step 3: Manually verify the golden path in a browser**

Open `http://localhost:3000`. Walk through, confirming each works with no console errors and no fallback-to-offline warning (`isOfflineMode` in `src/api.ts` should stay `false`):

1. Log in / land on dashboard — data loads (rooms, tenants, bills, expenses, complaints, settings all visible)
2. Rooms tab: add a room, edit its status
3. Tenants tab: add a tenant assigned to that room — confirm the room flips to "Terisi" and a first bill appears in Bills tab
4. Bills tab: record a partial payment, then a full payment — confirm tenant status updates
5. Expenses tab: add an expense
6. Complaints tab: add a complaint, mark it "Selesai" with a repair cost — confirm no duplicate expense appears
7. Settings tab: change a setting, save, reload the page — confirm it persisted
8. Settings tab: export a backup, then import it back — confirm data is unchanged after roundtrip
9. Tenants tab: move a tenant out — confirm room frees up and unpaid bills disappear

- [ ] **Step 4: Commit**

```bash
git add vite.config.ts
git commit -m "feat: switch frontend dev proxy from Express to Laravel backend"
```

---

## After this plan

Laravel now has full feature parity with Express and the frontend runs against it. Deferred to a later, separate decision (not part of this plan): whether to remove `server/` (Express) from the repo now that it's no longer the active backend, and whether to add auth.
