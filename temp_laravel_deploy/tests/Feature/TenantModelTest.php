<?php

namespace Tests\Feature;

use App\Models\Tenant;
use Tests\TestCase;

class TenantModelTest extends TestCase
{
    public function test_tenant_can_be_created_found_and_deleted(): void
    {
        $id = 'smoke-tenant-'.time();

        $tenant = Tenant::create([
            'id' => $id,
            'name' => 'Smoke Tester',
            'phone' => '08123',
            'email' => 's@t.id',
            'emergencyContact' => ['name' => 'X', 'relation' => 'Y', 'phone' => '0'],
            'idNumber' => '1',
            'roomAssigned' => 'room-does-not-matter',
            'moveInDate' => '2026-07-07',
            'rentAmount' => 500000,
            'deposit' => 0,
            'status' => 'Belum Bayar',
        ]);

        $this->assertSame($id, $tenant->id);

        $found = Tenant::find($id);
        $this->assertNotNull($found);
        $this->assertSame('X', $found->emergencyContact['name']);

        $found->delete();
        $this->assertNull(Tenant::find($id));
    }
}
