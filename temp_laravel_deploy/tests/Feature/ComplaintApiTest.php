<?php

namespace Tests\Feature;

use App\Models\Complaint;
use App\Models\Expense;
use Tests\TestCase;

class ComplaintApiTest extends TestCase
{
    public function test_complaint_crud_and_patch_does_not_auto_create_expense(): void
    {
        $id = 'smoke-comp-'.time();

        $this->postJson('/api/complaints', [
            'id' => $id,
            'tenantId' => 'smoke-tenant-x',
            'tenantName' => 'Smoke Tester',
            'roomId' => 'smoke-room-x',
            'roomNumber' => 'Z1',
            'title' => 'smoke',
            'category' => 'Lainnya',
            'status' => 'Baru',
            'priority' => 'Rendah',
            'date' => '2026-07-08',
            'description' => 'smoke',
        ])->assertCreated();

        $expenseCountBefore = Expense::count();

        $this->patchJson("/api/complaints/{$id}", [
            'status' => 'Selesai',
            'repairCost' => 5000,
        ])
            ->assertOk()
            ->assertJsonFragment(['status' => 'Selesai', 'repairCost' => 5000]);

        // unrelated field from the original create must survive the partial merge
        $updated = Complaint::find($id);
        $this->assertSame('smoke', $updated->title);
        $this->assertSame($expenseCountBefore, Expense::count());

        $this->patchJson('/api/complaints/does-not-exist', ['status' => 'Selesai'])
            ->assertNotFound()
            ->assertJson(['error' => 'Komplain tidak ditemukan']);

        $this->deleteJson("/api/complaints/{$id}")
            ->assertOk()
            ->assertJson(['ok' => true]);

        $this->assertNull(Complaint::find($id));
    }
}
