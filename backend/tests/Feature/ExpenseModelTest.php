<?php

namespace Tests\Feature;

use App\Models\Expense;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExpenseModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_expense_can_be_created_found_and_deleted(): void
    {
        $id = 'smoke-exp-'.time();

        Expense::create([
            'id' => $id,
            'category' => 'Lainnya',
            'description' => 'smoke',
            'date' => '2026-07-08',
            'amount' => 1000,
        ]);

        $this->assertNotNull(Expense::find($id));

        Expense::find($id)->delete();
        $this->assertNull(Expense::find($id));
    }
}
