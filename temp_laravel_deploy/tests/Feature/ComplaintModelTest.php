<?php

namespace Tests\Feature;

use App\Models\Complaint;
use Tests\TestCase;

class ComplaintModelTest extends TestCase
{
    public function test_complaint_can_be_created_found_and_deleted(): void
    {
        $id = 'smoke-comp-'.time();

        Complaint::create([
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
        ]);

        $this->assertNotNull(Complaint::find($id));

        Complaint::find($id)->delete();
        $this->assertNull(Complaint::find($id));
    }
}
