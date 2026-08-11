<?php

namespace App\Http\Controllers;

use App\Models\Bill;
use App\Models\Complaint;
use App\Models\Expense;
use App\Models\Property;
use App\Models\Room;
use App\Models\Setting;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class SuperAdminController extends Controller
{
    /**
     * Middleware check to ensure caller is a Super Admin.
     */
    private function checkSuperAdmin(Request $request)
    {
        if (($request->user()->role ?? 'owner') !== 'super_admin') {
            abort(response()->json(['error' => 'Akses ditolak. Fitur ini hanya untuk Master Admin SaaS.'], 403));
        }
    }

    /**
     * Get platform-wide SaaS metrics.
     */
    public function metrics(Request $request)
    {
        $this->checkSuperAdmin($request);

        $totalOwners = User::where('role', '!=', 'super_admin')->count();
        $activeOwners = User::where('role', '!=', 'super_admin')->where('status', 'active')->count();
        $suspendedOwners = User::where('role', '!=', 'super_admin')->where('status', 'suspended')->count();

        $totalRooms = Room::count();
        $occupiedRooms = Room::where('status', 'Terisi')->count();
        $totalTenants = Tenant::count();

        $totalRevenuePaid = Bill::where('status', 'Lunas')->sum('totalAmount');
        $totalRevenuePending = Bill::where('status', '!=', 'Lunas')->sum('totalAmount');

        return response()->json([
            'totalOwners'         => $totalOwners,
            'activeOwners'        => $activeOwners,
            'suspendedOwners'     => $suspendedOwners,
            'totalRooms'          => $totalRooms,
            'occupiedRooms'       => $occupiedRooms,
            'totalTenants'        => $totalTenants,
            'totalRevenuePaid'    => $totalRevenuePaid,
            'totalRevenuePending' => $totalRevenuePending,
        ]);
    }

    /**
     * List all SaaS Property Owner accounts with metadata.
     */
    public function users(Request $request)
    {
        $this->checkSuperAdmin($request);

        $users = User::where('role', '!=', 'super_admin')
            ->orderBy('created_at', 'desc')
            ->get();

        $result = $users->map(function ($u) {
            $settingData = [];
            try {
                $setting = Setting::where('user_id', $u->id)->first();
                $settingData = $setting ? json_decode($setting->data, true) : [];
            } catch (\Throwable $e) {}

            $roomCount = 0;
            try { $roomCount = Room::where('user_id', $u->id)->count(); } catch (\Throwable $e) {}

            $tenantCount = 0;
            try { $tenantCount = Tenant::where('user_id', $u->id)->count(); } catch (\Throwable $e) {}

            $propertyCount = 1;
            try {
                if (Schema::hasTable('kostos_properties')) {
                    $cnt = Property::where('user_id', $u->id)->count();
                    $propertyCount = $cnt > 0 ? $cnt : 1;
                }
            } catch (\Throwable $e) {}

            return [
                'id'            => $u->id,
                'name'          => $u->name,
                'phone'         => $u->phone,
                'slug'          => $u->slug ?? ('owner-' . $u->id),
                'email'         => $u->email,
                'role'          => $u->role ?? 'owner',
                'status'        => $u->status ?? 'active',
                'plan'          => $u->plan ?? 'pro',
                'kostName'      => $settingData['kostName'] ?? ($u->name . ' Kost'),
                'roomCount'     => $roomCount,
                'tenantCount'   => $tenantCount,
                'propertyCount' => $propertyCount,
                'createdAt'     => $u->created_at ? $u->created_at->format('Y-m-d H:i') : null,
            ];
        });

        return response()->json($result);
    }

    /**
     * Toggle status of an owner account (active <-> suspended).
     */
    public function updateStatus(Request $request, string $id)
    {
        $this->checkSuperAdmin($request);

        $request->validate([
            'status' => 'required|in:active,suspended',
        ]);

        $user = User::where('id', $id)->where('role', '!=', 'super_admin')->first();
        if (! $user) {
            return response()->json(['error' => 'Akun tidak ditemukan'], 404);
        }

        $user->status = $request->status;
        $user->save();

        if ($user->status === 'suspended') {
            // Revoke active API tokens for suspended user
            $user->tokens()->delete();
        }

        return response()->json([
            'ok'     => true,
            'status' => $user->status,
        ]);
    }

    /**
     * Update subscription plan (basic / pro).
     */
    public function updatePlan(Request $request, string $id)
    {
        $this->checkSuperAdmin($request);

        $request->validate([
            'plan' => 'required|in:basic,pro',
        ]);

        $user = User::where('id', $id)->where('role', '!=', 'super_admin')->first();
        if (! $user) {
            return response()->json(['error' => 'Akun tidak ditemukan'], 404);
        }

        $user->plan = $request->plan;
        $user->save();

        return response()->json([
            'ok'   => true,
            'plan' => $user->plan,
        ]);
    }

    /**
     * Delete an owner account and cascade delete all their data.
     */
    public function destroy(Request $request, string $id)
    {
        $this->checkSuperAdmin($request);

        $user = User::where('id', $id)->where('role', '!=', 'super_admin')->first();
        if (! $user) {
            return response()->json(['error' => 'Akun tidak ditemukan'], 404);
        }

        DB::transaction(function () use ($user) {
            $userId = $user->id;
            Bill::where('user_id', $userId)->delete();
            Complaint::where('user_id', $userId)->delete();
            Expense::where('user_id', $userId)->delete();
            Tenant::where('user_id', $userId)->delete();
            Room::where('user_id', $userId)->delete();
            if (Schema::hasTable('kostos_properties')) {
                Property::where('user_id', $userId)->delete();
            }
            Setting::where('user_id', $userId)->delete();

            $user->tokens()->delete();
            $user->delete();
        });

        return response()->json(['ok' => true]);
    }
}
