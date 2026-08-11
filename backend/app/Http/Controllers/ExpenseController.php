<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    public function index(Request $request)
    {
        return Expense::where('user_id', $request->user()->id)
            ->orderBy('seq', 'desc')
            ->get();
    }

    public function store(Request $request)
    {
        $data = $request->all();
        $data['user_id'] = $request->user()->id;

        $expense = Expense::updateOrCreate(
            ['id' => $data['id'], 'user_id' => $data['user_id']],
            $data
        );

        return response()->json($expense, 201);
    }

    public function destroy(Request $request, string $id)
    {
        Expense::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->delete();

        return response()->json(['ok' => true]);
    }
}
