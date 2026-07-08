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
