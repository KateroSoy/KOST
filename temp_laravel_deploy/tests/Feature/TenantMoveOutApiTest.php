<?php

namespace Tests\Feature;

use App\Models\Bill;
use App\Models\Room;
use App\Models\Tenant;
use Tests\TestCase;

class TenantMoveOutApiTest extends TestCase
{
    public function test_move_out_drops_unpaid_bills_frees_room_and_deletes_tenant(): void
    {
        $ts = time();
        $roomId = "smoke-room-{$ts}";
        $tenantId = "smoke-tenant-{$ts}";
        $paidBillId = "smoke-bill-paid-{$ts}";
        $unpaidBillId = "smoke-bill-unpaid-{$ts}";

        Room::create([
            'id' => $roomId, 'number' => "Z{$ts}", 'status' => 'Terisi',
            'type' => 'Standard', 'price' => 500000, 'floor' => 9, 'size' => '3x3 m',
            'facilities' => [], 'tenantId' => $tenantId,
        ]);

        Tenant::create([
            'id' => $tenantId, 'name' => 'Smoke Tester', 'phone' => '08123',
            'email' => 's@t.id', 'emergencyContact' => ['name' => 'X', 'relation' => 'Y', 'phone' => '0'],
            'idNumber' => '1', 'roomAssigned' => $roomId, 'moveInDate' => '2026-07-07',
            'rentAmount' => 500000, 'deposit' => 0, 'status' => 'Lunas',
        ]);

        $billAttrs = [
            'tenantId' => $tenantId, 'tenantName' => 'Smoke Tester', 'roomId' => $roomId,
            'roomNumber' => "Z{$ts}", 'period' => 'Juli 2026', 'dueDate' => '2026-07-05',
            'rentAmount' => 500000, 'electricityCharge' => 0, 'waterCharge' => 0,
            'additionalFee' => 0, 'discount' => 0, 'lateFee' => 0,
            'totalAmount' => 500000, 'paidAmount' => 0,
        ];
        Bill::create(['id' => $paidBillId, 'status' => 'Lunas'] + $billAttrs);
        Bill::create(['id' => $unpaidBillId, 'status' => 'Belum Bayar'] + $billAttrs);

        $this->postJson("/api/tenants/{$tenantId}/move-out")
            ->assertOk()
            ->assertJson(['ok' => true]);

        $this->assertNull(Tenant::find($tenantId));
        $this->assertNull(Bill::find($unpaidBillId));
        $this->assertNotNull(Bill::find($paidBillId));

        $room = Room::find($roomId);
        $this->assertSame('Kosong', $room->status);
        $this->assertNull($room->tenantId);

        $this->postJson('/api/tenants/does-not-exist/move-out')
            ->assertNotFound()
            ->assertJson(['error' => 'Penghuni tidak ditemukan']);

        // cleanup
        Bill::find($paidBillId)->delete();
        $room->delete();
    }

    public function test_destroy_deletes_tenant_without_side_effects(): void
    {
        $ts = time();
        $tenantId = "smoke-tenant-destroy-{$ts}";

        Tenant::create([
            'id' => $tenantId, 'name' => 'Smoke Tester', 'phone' => '08123',
            'email' => 's@t.id', 'emergencyContact' => ['name' => 'X', 'relation' => 'Y', 'phone' => '0'],
            'idNumber' => '1', 'roomAssigned' => 'none', 'moveInDate' => '2026-07-07',
            'rentAmount' => 0, 'deposit' => 0, 'status' => 'Lunas',
        ]);

        $this->deleteJson("/api/tenants/{$tenantId}")
            ->assertOk()
            ->assertJson(['ok' => true]);

        $this->assertNull(Tenant::find($tenantId));
    }
}
