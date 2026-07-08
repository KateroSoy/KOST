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
        if (! $request->has('kostSettings') || $request->input('kostSettings') === null) {
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
