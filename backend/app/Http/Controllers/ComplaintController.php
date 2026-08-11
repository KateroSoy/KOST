<?php

namespace App\Http\Controllers;

use App\Models\Complaint;
use Illuminate\Http\Request;

class ComplaintController extends Controller
{
    public function index(Request $request)
    {
        return Complaint::where('user_id', $request->user()->id)
            ->orderBy('seq', 'desc')
            ->get();
    }

    public function store(Request $request)
    {
        $data = $request->all();
        $data['user_id'] = $request->user()->id;

        $complaint = Complaint::updateOrCreate(
            ['id' => $data['id'], 'user_id' => $data['user_id']],
            $data
        );

        return response()->json($complaint, 201);
    }

    public function update(Request $request, string $id)
    {
        $complaint = Complaint::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

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

    public function destroy(Request $request, string $id)
    {
        Complaint::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->delete();

        return response()->json(['ok' => true]);
    }
}
