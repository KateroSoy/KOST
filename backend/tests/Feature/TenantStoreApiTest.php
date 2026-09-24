<?php

namespace Tests\Feature;

use App\Models\Bill;
use App\Models\Room;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenantStoreApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_monthly_check_in_after_due_day_uses_next_month(): void
    {
        $this->travelTo(\Illuminate\Support\Carbon::parse('2026-09-22'));
        $user = $this->actingAsOwner();
        Room::create([
            'id' => 'due-date-room', 'user_id' => $user->id, 'number' => 'DUE-1',
            'status' => 'Kosong', 'type' => 'Studio', 'price' => 4500000,
            'floor' => 1, 'size' => '4x4', 'facilities' => [],
        ]);

        $this->postJson('/api/tenants', [
            'id' => 'due-date-tenant', 'name' => 'Due Date Guest', 'phone' => '081234567890',
            'roomAssigned' => 'due-date-room', 'moveInDate' => '2026-09-22',
            'guestType' => 'Bulanan', 'rentAmount' => 4500000,
            'deposit' => 0, 'status' => 'Belum Bayar',
        ])->assertCreated();

        $this->assertSame('2026-10-05', Bill::where('tenantId', 'due-date-tenant')->first()->dueDate);
    }

    public function test_creating_tenant_flips_room_and_creates_first_bill(): void
    {
        $user = $this->actingAsOwner();
        $ts = time();
        $roomId = "smoke-room-{$ts}";
        $tenantId = "smoke-tenant-{$ts}";

        Room::create([
            'id' => $roomId,
            'user_id' => $user->id,
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
