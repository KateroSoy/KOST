<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    public function index()
    {
        return Expense::orderBy('seq', 'desc')->get();
    }

    public function store(Request $request)
    {
        $expense = Expense::updateOrCreate(['id' => $request->input('id')], $request->all());

        return response()->json($expense, 201);
    }

    public function destroy(string $id)
    {
        Expense::destroy($id);

        return response()->json(['ok' => true]);
    }
}
