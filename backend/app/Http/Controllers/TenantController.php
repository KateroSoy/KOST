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

    public function index(Request $request)
    {
        return Tenant::where('user_id', $request->user()->id)
            ->orderBy('seq')
            ->get();
    }

    public function store(Request $request)
    {
        $data = $request->all();
        $data['user_id'] = $request->user()->id;
        $userId = $data['user_id'];

        $tenant = DB::transaction(function () use ($data, $userId) {
            $isNewTenant = !Tenant::where('id', $data['id'])->where('user_id', $userId)->exists();

            $tenant = Tenant::updateOrCreate(
                ['id' => $data['id'], 'user_id' => $userId],
                $data
            );

            $room = Room::where('user_id', $userId)
                ->where(function ($q) use ($tenant) {
                    $q->where('id', $tenant->roomAssigned)
                      ->orWhere('number', $tenant->roomAssigned);
                })
                ->first();

            if ($room) {
                $room->status             = 'Terisi';
                $room->tenantId           = $tenant->id;
                $room->housekeepingStatus = 'Bersih';
                $room->save();
            }

            // Only auto-create bill if this is a genuinely new tenant (not a re-sync/restore)
            $billAlreadyExists = Bill::where('user_id', $userId)
                ->where('tenantId', $tenant->id)
                ->exists();

            if (!$isNewTenant || $billAlreadyExists) {
                return $tenant;
            }

            $isHarian = ($tenant->guestType ?? 'Bulanan') === 'Harian';
            $now = now();

            if ($isHarian) {
                $checkIn  = $tenant->checkInDate  ?? $now->toDateString();
                $checkOut = $tenant->checkOutDate ?? $now->addDays(1)->toDateString();

                $diffDays    = max(1, (int) ceil((strtotime($checkOut) - strtotime($checkIn)) / 86400));
                $pricePerDay = $room?->pricePerDay ?: ($room?->price ? (int) round($room->price / 30) : 0);
                $rentAmount  = $pricePerDay * $diffDays;

                $period  = date('d', strtotime($checkIn)) . ' - ' . date('d M Y', strtotime($checkOut));
                $dueDate = $checkOut;

                Bill::create([
                    'id'           => 'bill-harian-' . (int) round(microtime(true) * 1000),
                    'user_id'      => $userId,
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
                $rentAmount = $room?->pricePerMonth ?: ($room?->price ?? ($tenant->rentAmount ?? 0));
                $dueDateDay = Setting::defaultDueDateDay($userId);
                $billStart = \Illuminate\Support\Carbon::parse($tenant->moveInDate ?: $now->toDateString())->startOfDay();
                if ($billStart->lt($now->copy()->startOfDay())) {
                    $billStart = $now->copy()->startOfDay();
                }
                $dueMonth = $billStart->copy()->startOfMonth();
                $dueDate = $dueMonth->copy()->day(min($dueDateDay, $dueMonth->daysInMonth));
                if ($dueDate->lt($billStart)) {
                    $dueMonth = $dueMonth->addMonth();
                    $dueDate = $dueMonth->copy()->day(min($dueDateDay, $dueMonth->daysInMonth));
                }

                Bill::create([
                    'id'           => 'bill-auto-' . (int) round(microtime(true) * 1000),
                    'user_id'      => $userId,
                    'tenantId'     => $tenant->id,
                    'tenantName'   => $tenant->name,
                    'roomId'       => $room?->id ?? '',
                    'roomNumber'   => $room?->number ?? ($tenant->roomAssigned ?? ''),
                    'rentalType'   => 'Bulanan',
                    'stayDuration' => 1,
                    'period'       => self::MONTHS_ID[$now->month - 1] . ' ' . $now->year,
                    'dueDate'      => $dueDate->toDateString(),
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

    public function moveOut(Request $request, string $id)
    {
        $userId = $request->user()->id;

        $tenant = Tenant::where('id', $id)->where('user_id', $userId)->first();

        if (! $tenant) {
            return response()->json(['error' => 'Penghuni tidak ditemukan'], 404);
        }

        DB::transaction(function () use ($tenant, $userId) {
            Bill::where('user_id', $userId)
                ->where('tenantId', $tenant->id)
                ->where('status', '!=', 'Lunas')
                ->delete();

            Room::where('user_id', $userId)
                ->where(function ($q) use ($tenant) {
                    $q->where('tenantId', $tenant->id)
                      ->orWhere('number', $tenant->roomAssigned)
                      ->orWhere('id', $tenant->roomAssigned);
                })
                ->update([
                    'status'             => 'Kosong',
                    'housekeepingStatus' => 'Kotor',
                    'tenantId'           => null,
                ]);

            $tenant->delete();
        });

        return response()->json(['ok' => true]);
    }

    public function update(Request $request, string $id)
    {
        $tenant = Tenant::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (! $tenant) {
            return response()->json(['error' => 'Penghuni tidak ditemukan'], 404);
        }

        $tenant->fill($request->all());
        $tenant->save();

        return response()->json($tenant);
    }

    public function destroy(Request $request, string $id)
    {
        Tenant::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->delete();

        return response()->json(['ok' => true]);
    }
}
