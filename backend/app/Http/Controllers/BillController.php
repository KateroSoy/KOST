<?php

namespace App\Http\Controllers;

use App\Models\Bill;
use App\Models\Room;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BillController extends Controller
{
    public function index(Request $request)
    {
        $userId = $request->user()->id;

        Bill::where('user_id', $userId)
            ->where('status', 'Belum Bayar')
            ->where('dueDate', '<', now()->toDateString())
            ->update(['status' => 'Terlambat']);

        $overdueIds = Bill::where('user_id', $userId)
            ->where('status', 'Terlambat')
            ->pluck('tenantId')
            ->unique()
            ->values();

        if ($overdueIds->isNotEmpty()) {
            Tenant::where('user_id', $userId)
                ->whereIn('id', $overdueIds)
                ->where('status', '!=', 'Lunas')
                ->update(['status' => 'Terlambat']);
        }

        return Bill::where('user_id', $userId)->orderBy('seq', 'desc')->get();
    }

    public function store(Request $request)
    {
        $data = $request->all();
        $data['user_id'] = $request->user()->id;

        $bill = DB::transaction(function () use ($data) {
            $bill = Bill::updateOrCreate(
                ['id' => $data['id'], 'user_id' => $data['user_id']],
                $data
            );

            Tenant::where('id', $bill->tenantId)
                ->where('user_id', $data['user_id'])
                ->update(['status' => 'Belum Bayar']);

            Room::where('number', $bill->roomNumber)
                ->where('user_id', $data['user_id'])
                ->update(['status' => 'Terisi']);

            return $bill;
        });

        return response()->json($bill, 201);
    }

    public function payments(Request $request, string $id)
    {
        $bill = Bill::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (! $bill) {
            return response()->json(['error' => 'Tagihan tidak ditemukan'], 404);
        }

        $amountPaid   = (int) $request->input('amountPaid', 0);
        $nextPaid     = $bill->paidAmount + $amountPaid;
        $reachedLunas = $nextPaid >= $bill->totalAmount;
        $userId       = $request->user()->id;

        DB::transaction(function () use ($request, $bill, $nextPaid, $reachedLunas, $userId) {
            $bill->paidAmount    = $nextPaid;
            $bill->status        = $reachedLunas ? 'Lunas' : 'Sebagian';
            $bill->paymentMethod = $request->input('method');
            $bill->paymentDate   = $request->input('date');
            $bill->notes         = $request->input('notes') ?: $bill->notes;
            $bill->save();

            if ($reachedLunas) {
                Tenant::where('id', $bill->tenantId)
                    ->where('user_id', $userId)
                    ->update(['status' => 'Lunas']);
                Room::where('number', $bill->roomNumber)
                    ->where('user_id', $userId)
                    ->update(['status' => 'Terisi']);
            }
        });

        return response()->json($bill);
    }

    public function destroy(Request $request, string $id)
    {
        $bill = Bill::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (! $bill) {
            return response()->json(['ok' => true]); // already gone
        }

        if ($bill->status === 'Lunas') {
            return response()->json([
                'error' => 'Tagihan yang sudah lunas tidak dapat dihapus untuk menjaga integritas catatan keuangan.'
            ], 422);
        }

        $bill->delete();

        return response()->json(['ok' => true]);
    }
}
