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
