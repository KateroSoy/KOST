<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\BillController;
use App\Http\Controllers\ComplaintController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\PropertyController;
use App\Http\Controllers\PublicController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\RestoreController;
use App\Http\Controllers\RoomController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\SuperAdminController;
use App\Http\Controllers\TenantController;
use Illuminate\Support\Facades\Route;

// Public routes (no auth required)
Route::get('/health', fn () => response()->json(['ok' => true]));
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login',    [AuthController::class, 'login']);
Route::get('/public/owner/{slug}', [PublicController::class, 'show']);
Route::get('/public/properties', [PublicController::class, 'index'])->middleware('throttle:60,1');
Route::get('/public/properties/{id}',[PublicController::class, 'property']);
Route::post('/public/properties/{id}/bookings', [PublicController::class, 'book'])->middleware('throttle:10,1');

// Protected routes (require Bearer token via Sanctum)
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::get('/auth/me',               [AuthController::class, 'me']);
    Route::post('/auth/logout',          [AuthController::class, 'logout']);
    Route::post('/auth/change-password', [AuthController::class, 'changePassword']);

    // Super Admin Routes (SaaS Platform Management)
    Route::get('/admin/metrics',           [SuperAdminController::class, 'metrics']);
    Route::get('/admin/users',             [SuperAdminController::class, 'users']);
    Route::patch('/admin/users/{id}/status', [SuperAdminController::class, 'updateStatus']);
    Route::patch('/admin/users/{id}/plan',   [SuperAdminController::class, 'updatePlan']);
    Route::delete('/admin/users/{id}',     [SuperAdminController::class, 'destroy']);

    // Rooms
    Route::get('/rooms',            [RoomController::class, 'index']);
    Route::post('/rooms',           [RoomController::class, 'store']);
    Route::put('/rooms/{id}',       [RoomController::class, 'replace']);   // Full room edit
    Route::patch('/rooms/{id}',     [RoomController::class, 'update']);    // Partial (status/housekeeping)
    Route::patch('/rooms/{id}/status', [RoomController::class, 'update']);
    Route::patch('/rooms/{id}/housekeeping', [RoomController::class, 'update']);
    Route::delete('/rooms/{id}',    [RoomController::class, 'destroy']);

    // Tenants
    Route::get('/tenants',                  [TenantController::class, 'index']);
    Route::post('/tenants',                 [TenantController::class, 'store']);
    Route::put('/tenants/{id}',             [TenantController::class, 'update']);  // Full tenant edit
    Route::post('/tenants/{id}/move-out',   [TenantController::class, 'moveOut']);
    Route::post('/tenants/{id}/moveout',    [TenantController::class, 'moveOut']);
    Route::delete('/tenants/{id}',          [TenantController::class, 'destroy']);

    // Expenses
    Route::get('/expenses',          [ExpenseController::class, 'index']);
    Route::post('/expenses',         [ExpenseController::class, 'store']);
    Route::delete('/expenses/{id}',  [ExpenseController::class, 'destroy']);

    // Complaints
    Route::get('/complaints',          [ComplaintController::class, 'index']);
    Route::post('/complaints',         [ComplaintController::class, 'store']);
    Route::patch('/complaints/{id}',   [ComplaintController::class, 'update']);
    Route::patch('/complaints/{id}/status', [ComplaintController::class, 'update']);
    Route::delete('/complaints/{id}',  [ComplaintController::class, 'destroy']);

    // Bills
    Route::get('/bills',                    [BillController::class, 'index']);
    Route::post('/bills',                   [BillController::class, 'store']);
    Route::post('/bills/{id}/payments',     [BillController::class, 'payments']);
    Route::post('/bills/{id}/payment',      [BillController::class, 'payments']);
    Route::delete('/bills/{id}',            [BillController::class, 'destroy']);

    // Settings
    Route::get('/settings',  [SettingController::class, 'index']);
    Route::put('/settings',  [SettingController::class, 'update']);

    // Properties (multi-tenant, persisted to DB)
    Route::get('/properties',          [PropertyController::class, 'index']);
    Route::post('/properties',         [PropertyController::class, 'store']);
    Route::put('/properties/{id}',     [PropertyController::class, 'update']);
    Route::delete('/properties/{id}',  [PropertyController::class, 'destroy']);

    // Bookings, Operations, Staff, Website Configs (Pro tier)
    Route::middleware('plan:pro')->group(function () {
        // Bookings
        Route::get('/bookings',            [\App\Http\Controllers\BookingController::class, 'index']);
        Route::post('/bookings',           [\App\Http\Controllers\BookingController::class, 'store']);
        Route::delete('/bookings/{id}',    [\App\Http\Controllers\BookingController::class, 'destroy']);
        Route::patch('/bookings/{id}/status', [\App\Http\Controllers\BookingController::class, 'updateStatus']);

        // Operations
        Route::get('/operations',          [\App\Http\Controllers\OperationTaskController::class, 'index']);
        Route::post('/operations',         [\App\Http\Controllers\OperationTaskController::class, 'store']);
        Route::delete('/operations/{id}',  [\App\Http\Controllers\OperationTaskController::class, 'destroy']);
        Route::patch('/operations/{id}/status', [\App\Http\Controllers\OperationTaskController::class, 'updateStatus']);

        // Staff
        Route::get('/staff',               [\App\Http\Controllers\StaffMemberController::class, 'index']);
        Route::post('/staff',              [\App\Http\Controllers\StaffMemberController::class, 'store']);
        Route::delete('/staff/{id}',       [\App\Http\Controllers\StaffMemberController::class, 'destroy']);
        Route::patch('/staff/{id}/role',   [\App\Http\Controllers\StaffMemberController::class, 'updateRole']);

        // Website Configs
        Route::get('/website-configs',     [\App\Http\Controllers\WebsiteConfigController::class, 'index']);
        Route::post('/website-configs',    [\App\Http\Controllers\WebsiteConfigController::class, 'store']);
        Route::delete('/website-configs/{propertyId}', [\App\Http\Controllers\WebsiteConfigController::class, 'destroy']);
    });

    // Restore (full data import for authenticated user only)
    Route::post('/restore', [RestoreController::class, 'store']);

    // Reports (Pro tier)
    Route::middleware('plan:pro')->group(function () {
        Route::get('/reports', [ReportController::class, 'index']);
    });
});
