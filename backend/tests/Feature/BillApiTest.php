<?php

namespace Tests\Feature;

use App\Models\Bill;
use App\Models\Room;
use App\Models\Tenant;
use Tests\TestCase;

class BillApiTest extends TestCase
{
    public function test_bill_store_flips_tenant_and_room_then_payment_reaches_lunas(): void
    {
        $ts = time();
        $roomId = "smoke-room-{$ts}";
        $roomNumber = "Z{$ts}";
        $tenantId = "smoke-tenant-{$ts}";
        $billId = "smoke-bill-{$ts}";

        Room::create([
            'id' => $roomId, 'number' => $roomNumber, 'status' => 'Kosong',
            'type' => 'Standard', 'price' => 500000, 'floor' => 9, 'size' => '3x3 m',
            'facilities' => [],
        ]);

        Tenant::create([
            'id' => $tenantId, 'name' => 'Smoke Tester', 'phone' => '08123',
            'email' => 's@t.id', 'emergencyContact' => ['name' => 'X', 'relation' => 'Y', 'phone' => '0'],
            'idNumber' => '1', 'roomAssigned' => $roomId, 'moveInDate' => '2026-07-08',
            'rentAmount' => 500000, 'deposit' => 0, 'status' => 'Terlambat',
        ]);

        $this->postJson('/api/bills', [
            'id' => $billId, 'tenantId' => $tenantId, 'tenantName' => 'Smoke Tester',
            'roomId' => $roomId, 'roomNumber' => $roomNumber, 'period' => 'Juli 2026',
            'dueDate' => '2026-07-05', 'rentAmount' => 500000, 'electricityCharge' => 0,
            'waterCharge' => 0, 'additionalFee' => 0, 'discount' => 0, 'lateFee' => 0,
            'totalAmount' => 500000, 'paidAmount' => 0, 'status' => 'Belum Bayar',
        ])->assertCreated();

        $this->assertSame('Belum Bayar', Tenant::find($tenantId)->status);
        $this->assertSame('Terisi', Room::find($roomId)->status);

        $this->postJson("/api/bills/{$billId}/payments", [
            'amountPaid' => 200000, 'method' => 'Tunai', 'date' => '2026-07-08',
        ])
            ->assertOk()
            ->assertJsonFragment(['status' => 'Sebagian', 'paidAmount' => 200000]);

        $this->assertSame('Sebagian', Bill::find($billId)->status);
        $this->assertSame(200000, Bill::find($billId)->paidAmount);
        $this->assertSame('Belum Bayar', Tenant::find($tenantId)->status);

        $this->postJson("/api/bills/{$billId}/payments", [
            'amountPaid' => 300000, 'method' => 'Tunai', 'date' => '2026-07-08',
        ])
            ->assertOk()
            ->assertJsonFragment(['status' => 'Lunas', 'paidAmount' => 500000]);

        $this->assertSame('Lunas', Tenant::find($tenantId)->status);

        $this->postJson('/api/bills/does-not-exist/payments', ['amountPaid' => 1000])
            ->assertNotFound()
            ->assertJson(['error' => 'Tagihan tidak ditemukan']);

        $this->deleteJson("/api/bills/{$billId}")
            ->assertOk()
            ->assertJson(['ok' => true]);

        // cleanup
        Tenant::find($tenantId)->delete();
        Room::find($roomId)->delete();
    }
}
