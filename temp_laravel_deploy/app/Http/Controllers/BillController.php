<?php

namespace App\Http\Controllers;

use App\Models\Bill;
use App\Models\Room;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BillController extends Controller
{
    /**
     * List all bills.
     *
     * Auto-marks bills as 'Terlambat' when:
     * - status is still 'Belum Bayar'
     * - dueDate < today
     *
     * This is a computed update on every read — no cron job needed.
     */
    public function index()
    {
        // Mark overdue bills in a single batch UPDATE before returning
        Bill::where('status', 'Belum Bayar')
            ->where('dueDate', '<', now()->toDateString())
            ->update(['status' => 'Terlambat']);

        // Also update corresponding tenant statuses for overdue bills
        $overdueIds = Bill::where('status', 'Terlambat')
            ->pluck('tenantId')
            ->unique()
            ->values();

        if ($overdueIds->isNotEmpty()) {
            Tenant::whereIn('id', $overdueIds)
                ->where('status', '!=', 'Lunas')
                ->update(['status' => 'Terlambat']);
        }

        return Bill::orderBy('seq', 'desc')->get();
    }

    /**
     * Create / upsert a bill.
     *
     * Also flips tenant → 'Belum Bayar' and confirms room is 'Terisi'.
     */
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

    /**
     * Record a payment against a bill.
     *
     * Mirrors handleRecordPayment in App.tsx:
     * - Accumulates paidAmount
     * - Sets status to 'Lunas' when fully paid, 'Sebagian' for partial
     * - On Lunas: sets tenant status to 'Lunas'
     */
    public function payments(Request $request, string $id)
    {
        $bill = Bill::find($id);

        if (! $bill) {
            return response()->json(['error' => 'Tagihan tidak ditemukan'], 404);
        }

        $amountPaid  = (int) $request->input('amountPaid', 0);
        $nextPaid    = $bill->paidAmount + $amountPaid;
        $reachedLunas = $nextPaid >= $bill->totalAmount;

        DB::transaction(function () use ($request, $bill, $nextPaid, $reachedLunas) {
            $bill->paidAmount    = $nextPaid;
            $bill->status        = $reachedLunas ? 'Lunas' : 'Sebagian';
            $bill->paymentMethod = $request->input('method');
            $bill->paymentDate   = $request->input('date');
            $bill->notes         = $request->input('notes') ?: $bill->notes;
            $bill->save();

            if ($reachedLunas) {
                Tenant::where('id', $bill->tenantId)->update(['status' => 'Lunas']);
                // Room remains 'Terisi' — tenant is still staying, just fully paid
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
