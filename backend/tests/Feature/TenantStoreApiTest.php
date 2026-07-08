<?php

namespace Tests\Feature;

use App\Models\Bill;
use App\Models\Room;
use App\Models\Tenant;
use Tests\TestCase;

class TenantStoreApiTest extends TestCase
{
    public function test_creating_tenant_flips_room_and_creates_first_bill(): void
    {
        $ts = time();
        $roomId = "smoke-room-{$ts}";
        $tenantId = "smoke-tenant-{$ts}";

        Room::create([
            'id' => $roomId,
            'number' => "Z{$ts}",
            'status' => 'Kosong',
            'type' => 'Standard',
            'price' => 500000,
            'floor' => 9,
            'size' => '3x3 m',
            'facilities' => [],
        ]);

        $this->postJson('/api/tenants', [
            'id' => $tenantId,
            'name' => 'Smoke Tester',
            'phone' => '08123',
            'email' => 's@t.id',
            'emergencyContact' => ['name' => 'X', 'relation' => 'Y', 'phone' => '0'],
            'idNumber' => '1',
            'roomAssigned' => $roomId,
            'moveInDate' => '2026-07-07',
            'rentAmount' => 500000,
            'deposit' => 0,
            'status' => 'Belum Bayar',
        ])->assertCreated();

        $room = Room::find($roomId);
        $this->assertSame('Terisi', $room->status);
        $this->assertSame($tenantId, $room->tenantId);

        $bill = Bill::where('tenantId', $tenantId)->first();
        $this->assertNotNull($bill);
        $this->assertSame(500000, $bill->totalAmount);
        $this->assertSame('Belum Bayar', $bill->status);

        // cleanup
        $bill->delete();
        Tenant::find($tenantId)->delete();
        $room->delete();
    }
}
