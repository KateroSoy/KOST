<?php

namespace Tests\Feature;

use App\Models\Expense;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExpenseApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_expense_crud_endpoints(): void
    {
        $this->actingAsOwner();
        $id = 'smoke-exp-'.time();

        $this->postJson('/api/expenses', [
            'id' => $id,
            'category' => 'Lainnya',
            'description' => 'smoke',
            'date' => '2026-07-08',
            'amount' => 1000,
        ])->assertCreated();

        $list = $this->getJson('/api/expenses')->assertOk()->json();
        $this->assertTrue(collect($list)->contains(fn ($e) => $e['id'] === $id));

        $this->deleteJson("/api/expenses/{$id}")
            ->assertOk()
            ->assertJson(['ok' => true]);

        $this->assertNull(Expense::find($id));
    }
}
