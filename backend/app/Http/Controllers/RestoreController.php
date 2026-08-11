<?php

namespace App\Http\Controllers;

use App\Models\Bill;
use App\Models\Complaint;
use App\Models\Expense;
use App\Models\Property;
use App\Models\Room;
use App\Models\Setting;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class RestoreController extends Controller
{
    public function store(Request $request)
    {
        if (! $request->has('kostSettings') || $request->input('kostSettings') === null) {
            return response()->json(['error' => 'kostSettings wajib ada'], 400);
        }

        $userId = $request->user()->id;

        DB::transaction(function () use ($request, $userId) {
            // Wipe only this user's data
            Bill::where('user_id', $userId)->delete();
            Complaint::where('user_id', $userId)->delete();
            Expense::where('user_id', $userId)->delete();
            Tenant::where('user_id', $userId)->delete();
            Room::where('user_id', $userId)->delete();

            Setting::updateOrCreate(
                ['user_id' => $userId],
                ['data'    => $request->input('kostSettings')]
            );

            foreach ($request->input('rooms', []) as $room) {
                $room['user_id'] = $userId;
                $id = $room['id'] ?? null;
                if ($id) {
                    Room::updateOrCreate(['id' => $id, 'user_id' => $userId], $room);
                } else {
                    Room::create($room);
                }
            }
            foreach ($request->input('tenants', []) as $tenant) {
                $tenant['user_id'] = $userId;
                $id = $tenant['id'] ?? null;
                if ($id) {
                    Tenant::updateOrCreate(['id' => $id, 'user_id' => $userId], $tenant);
                } else {
                    Tenant::create($tenant);
                }
            }
            foreach ($request->input('bills', []) as $bill) {
                $bill['user_id'] = $userId;
                $id = $bill['id'] ?? null;
                if ($id) {
                    Bill::updateOrCreate(['id' => $id, 'user_id' => $userId], $bill);
                } else {
                    Bill::create($bill);
                }
            }
            foreach ($request->input('expenses', []) as $expense) {
                $expense['user_id'] = $userId;
                $id = $expense['id'] ?? null;
                if ($id) {
                    Expense::updateOrCreate(['id' => $id, 'user_id' => $userId], $expense);
                } else {
                    Expense::create($expense);
                }
            }
            foreach ($request->input('complaints', []) as $complaint) {
                $complaint['user_id'] = $userId;
                $id = $complaint['id'] ?? null;
                if ($id) {
                    Complaint::updateOrCreate(['id' => $id, 'user_id' => $userId], $complaint);
                } else {
                    Complaint::create($complaint);
                }
            }

            // Also restore properties if the table exists
            if (Schema::hasTable('kostos_properties')) {
                foreach ($request->input('properties', []) as $property) {
                    $property['user_id'] = $userId;
                    $id = $property['id'] ?? null;
                    if ($id) {
                        Property::updateOrCreate(['id' => $id, 'user_id' => $userId], $property);
                    } else {
                        Property::create($property);
                    }
                }
            }
        });

        return response()->json(['ok' => true]);
    }
}
