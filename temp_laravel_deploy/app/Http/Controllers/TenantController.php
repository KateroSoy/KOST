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

    /**
     * Store a new tenant (check-in).
     *
     * Mirrors handleAddTenant in App.tsx:
     * 1. Create/update the tenant record.
     * 2. Flip the room status to 'Terisi' and assign tenantId.
     * 3. Auto-create a first bill — uses Harian pricing when guestType is 'Harian',
     *    otherwise falls back to the standard monthly rate.
     */
    public function store(Request $request)
    {
        $data = $request->all();

        $tenant = DB::transaction(function () use ($data) {
            // 1. Persist the tenant (all fields including new dual-stay fields)
            $tenant = Tenant::updateOrCreate(['id' => $data['id']], $data);

            // 2. Resolve the assigned room
            $room = Room::where('id', $tenant->roomAssigned)
                ->orWhere('number', $tenant->roomAssigned)
                ->first();

            if ($room) {
                $room->status = 'Terisi';
                $room->tenantId = $tenant->id;
                $room->housekeepingStatus = 'Bersih'; // Room is ready when tenant checks in
                $room->save();
            }

            // 3. Build the first bill depending on stay type
            $isHarian = ($tenant->guestType ?? 'Bulanan') === 'Harian';
            $now = now();

            if ($isHarian) {
                // Daily stay: compute nights between checkIn and checkOut
                $checkIn  = $tenant->checkInDate  ?? $now->toDateString();
                $checkOut = $tenant->checkOutDate ?? $now->addDays(1)->toDateString();

                $diffDays    = max(1, (int) ceil((strtotime($checkOut) - strtotime($checkIn)) / 86400));
                $pricePerDay = $room?->pricePerDay ?: ($room?->price ? (int) round($room->price / 30) : 0);
                $rentAmount  = $pricePerDay * $diffDays;

                $period  = date('d', strtotime($checkIn)).' - '.date('d M Y', strtotime($checkOut));
                $dueDate = $checkOut; // Harian bills are due on check-out date

                $billId = 'bill-harian-'.(int) round(microtime(true) * 1000);
                Bill::create([
                    'id'           => $billId,
                    'tenantId'     => $tenant->id,
                    'tenantName'   => $tenant->name,
                    'roomId'       => $room?->id ?? '',
                    'roomNumber'   => $room?->number ?? ($tenant->roomAssigned ?? ''),
                    'rentalType'   => 'Harian',
                    'stayDuration' => $diffDays,
                    'checkInDate'  => $checkIn,
                    'checkOutDate' => $checkOut,
                    'period'       => $period,
                    'dueDate'      => $dueDate,
                    'rentAmount'   => $rentAmount,
                    'electricityCharge' => 0,
                    'waterCharge'  => 0,
                    'additionalFee'=> 0,
                    'discount'     => 0,
                    'lateFee'      => 0,
                    'totalAmount'  => $rentAmount,
                    'paidAmount'   => 0,
                    'status'       => 'Belum Bayar',
                ]);
            } else {
                // Monthly stay: standard monthly rate
                $rentAmount = $room?->pricePerMonth ?: ($room?->price ?? ($tenant->rentAmount ?? 0));
                $dueDateDay = Setting::defaultDueDateDay();

                Bill::create([
                    'id'           => 'bill-auto-'.(int) round(microtime(true) * 1000),
                    'tenantId'     => $tenant->id,
                    'tenantName'   => $tenant->name,
                    'roomId'       => $room?->id ?? '',
                    'roomNumber'   => $room?->number ?? ($tenant->roomAssigned ?? ''),
                    'rentalType'   => 'Bulanan',
                    'stayDuration' => 1,
                    'period'       => self::MONTHS_ID[$now->month - 1].' '.$now->year,
                    'dueDate'      => sprintf('%04d-%02d-%02d', $now->year, $now->month, $dueDateDay),
                    'rentAmount'   => $rentAmount,
                    'electricityCharge' => 0,
                    'waterCharge'  => 0,
                    'additionalFee'=> 0,
                    'discount'     => 0,
                    'lateFee'      => 0,
                    'totalAmount'  => $rentAmount,
                    'paidAmount'   => 0,
                    'status'       => 'Belum Bayar',
                ]);
            }

            return $tenant;
        });

        return response()->json($tenant, 201);
    }

    /**
     * Move-out a tenant (check-out).
     *
     * Mirrors handleMoveOutTenant in App.tsx:
     * 1. Delete all unpaid bills.
     * 2. Free the room — set status 'Kosong', housekeepingStatus 'Kotor' (needs cleaning).
     * 3. Delete the tenant record.
     */
    public function moveOut(string $id)
    {
        $tenant = Tenant::find($id);

        if (! $tenant) {
            return response()->json(['error' => 'Penghuni tidak ditemukan'], 404);
        }

        DB::transaction(function () use ($tenant) {
            // Delete unpaid bills for this tenant
            Bill::where('tenantId', $tenant->id)->where('status', '!=', 'Lunas')->delete();

            // Free the room and mark it dirty (needs housekeeping)
            Room::where('tenantId', $tenant->id)
                ->orWhere('number', $tenant->roomAssigned)
                ->orWhere('id', $tenant->roomAssigned)
                ->update([
                    'status'             => 'Kosong',
                    'housekeepingStatus' => 'Kotor',
                    'tenantId'           => null,
                ]);

            $tenant->delete();
        });

        return response()->json(['ok' => true]);
    }

    public function destroy(string $id)
    {
        Tenant::destroy($id);

        return response()->json(['ok' => true]);
    }
}
