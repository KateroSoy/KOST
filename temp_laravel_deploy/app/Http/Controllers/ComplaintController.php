<?php

namespace App\Http\Controllers;

use App\Models\Complaint;
use Illuminate\Http\Request;

class ComplaintController extends Controller
{
    public function index()
    {
        return Complaint::orderBy('seq', 'desc')->get();
    }

    public function store(Request $request)
    {
        $complaint = Complaint::updateOrCreate(['id' => $request->input('id')], $request->all());

        return response()->json($complaint, 201);
    }

    // Merges only the fields sent. Never creates an Expense here even when
    // status becomes 'Selesai' with a repairCost — the client syncs that
    // repair expense itself via a separate POST /api/expenses call.
    public function update(Request $request, string $id)
    {
        $complaint = Complaint::find($id);

        if (! $complaint) {
            return response()->json(['error' => 'Komplain tidak ditemukan'], 404);
        }

        foreach ($request->all() as $key => $value) {
            if ($value !== null) {
                $complaint->{$key} = $value;
            }
        }

        $complaint->save();

        return response()->json($complaint);
    }

    public function destroy(string $id)
    {
        Complaint::destroy($id);

        return response()->json(['ok' => true]);
    }
}
