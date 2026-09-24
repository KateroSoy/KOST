<?php

namespace Tests\Feature;

use App\Models\Bill;
use App\Models\Complaint;
use App\Models\Expense;
use App\Models\Room;
use App\Models\Setting;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StayFlowApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAsOwner();
    }

    /**
     * Test Health Endpoint
     */
    public function test_health_check_returns_ok(): void
    {
        $response = $this->getJson('/api/health');

        $response->assertStatus(200)
            ->assertJson(['ok' => true]);
    }

    /**
     * Test Settings API
     */
    public function test_settings_can_be_retrieved_and_updated(): void
    {
        $response = $this->getJson('/api/settings');
        $response->assertStatus(200);

        $updateData = [
            'kostName' => 'Test StayFlow Residence',
            'ownerName' => 'Owner Test',
            'whatsapp' => '08999999999',
            'address' => 'Jl. Test No. 123',
            'defaultDueDateDay' => 10,
        ];

        $putResponse = $this->putJson('/api/settings', $updateData);
        $putResponse->assertStatus(200)
            ->assertJsonPath('kostName', 'Test StayFlow Residence');
    }

    /**
     * Test Room CRUD and Housekeeping Status
     */
    public function test_room_lifecycle_and_housekeeping(): void
    {
        $roomId = 'test-room-'.microtime(true);

        $roomData = [
            'id' => $roomId,
            'number' => 'T101',
            'status' => 'Kosong',
            'housekeepingStatus' => 'Bersih',
            'type' => 'Suite',
            'price' => 1500000,
            'pricePerDay' => 150000,
            'pricePerMonth' => 1500000,
            'pricePerWeek' => 450000,
            'floor' => 1,
            'size' => '4x4 m',
            'maxGuests' => 2,
            'facilities' => ['AC', 'WiFi', 'Kamar Mandi Dalam'],
        ];

        // Create Room
        $postRes = $this->postJson('/api/rooms', $roomData);
        $postRes->assertStatus(201)
            ->assertJsonPath('number', 'T101');

        // Verify Room in List
        $getRes = $this->getJson('/api/rooms');
        $getRes->assertStatus(200);

        // Update Housekeeping Status
        $patchRes = $this->patchJson("/api/rooms/{$roomId}", [
            'housekeepingStatus' => 'Kotor',
        ]);
        $patchRes->assertStatus(200)
            ->assertJsonPath('housekeepingStatus', 'Kotor');

        // Cleanup
        $this->deleteJson("/api/rooms/{$roomId}")->assertStatus(200);
    }

    /**
     * Test Monthly Tenant Check-in & Bill Auto-Generation
     */
    public function test_monthly_tenant_checkin_creates_monthly_bill(): void
    {
        $roomId = 'test-room-m-'.microtime(true);
        $tenantId = 'test-tenant-m-'.microtime(true);

        // Create test room
        $this->postJson('/api/rooms', [
            'id' => $roomId,
            'number' => 'M101',
            'status' => 'Kosong',
            'type' => 'Standard',
            'price' => 1000000,
            'pricePerMonth' => 1000000,
            'floor' => 1,
            'size' => '3x3',
        ]);

        // Check-in Monthly Tenant
        $tenantData = [
            'id' => $tenantId,
            'name' => 'John Monthly',
            'phone' => '08123456789',
            'email' => 'john@example.com',
            'guestType' => 'Bulanan',
            'roomAssigned' => $roomId,
            'moveInDate' => '2026-08-01',
            'rentAmount' => 1000000,
            'deposit' => 200000,
            'status' => 'Belum Bayar',
            'emergencyContact' => ['name' => 'Jane', 'relation' => 'Wife', 'phone' => '08123'],
        ];

        $res = $this->postJson('/api/tenants', $tenantData);
        $res->assertStatus(201)
            ->assertJsonPath('name', 'John Monthly');

        // Check assigned room status is now 'Terisi'
        $roomCheck = Room::find($roomId);
        $this->assertEquals('Terisi', $roomCheck->status);

        // Check auto-generated bill
        $bill = Bill::where('tenantId', $tenantId)->first();
        $this->assertNotNull($bill);
        $this->assertEquals('Bulanan', $bill->rentalType);
        $this->assertEquals(1000000, $bill->totalAmount);

        // Cleanup Move-out
        $moveOutRes = $this->postJson("/api/tenants/{$tenantId}/move-out");
        $moveOutRes->assertStatus(200);

        // Room should be 'Kosong' and 'Kotor' after move-out
        $roomCheck = Room::find($roomId);
        $this->assertEquals('Kosong', $roomCheck->status);
        $this->assertEquals('Kotor', $roomCheck->housekeepingStatus);

        // Clean room
        $this->deleteJson("/api/rooms/{$roomId}");
    }

    /**
     * Test Daily (Harian) Tenant Check-in & Daily Calculation
     */
    public function test_daily_tenant_checkin_calculates_daily_rent(): void
    {
        $roomId = 'test-room-d-'.microtime(true);
        $tenantId = 'test-tenant-d-'.microtime(true);

        $this->postJson('/api/rooms', [
            'id' => $roomId,
            'number' => 'D101',
            'status' => 'Kosong',
            'type' => 'Deluxe',
            'price' => 3000000,
            'pricePerDay' => 150000,
            'floor' => 1,
            'size' => '4x4',
        ]);

        $tenantData = [
            'id' => $tenantId,
            'name' => 'Daily Guest',
            'phone' => '0811111111',
            'email' => 'guest@example.com',
            'guestType' => 'Harian',
            'checkInDate' => '2026-08-10',
            'checkOutDate' => '2026-08-13', // 3 nights
            'roomAssigned' => $roomId,
            'moveInDate' => '2026-08-10',
            'rentAmount' => 450000,
            'deposit' => 100000,
            'status' => 'Belum Bayar',
            'emergencyContact' => ['name' => 'Contact', 'relation' => 'Friend', 'phone' => '08222'],
        ];

        $this->postJson('/api/tenants', $tenantData)->assertStatus(201);

        // Bill should be 3 nights * 150,000 = 450,000
        $bill = Bill::where('tenantId', $tenantId)->first();
        $this->assertNotNull($bill);
        $this->assertEquals('Harian', $bill->rentalType);
        $this->assertEquals(3, $bill->stayDuration);
        $this->assertEquals(450000, $bill->rentAmount);

        // Test Payment recording
        $payRes = $this->postJson("/api/bills/{$bill->id}/payments", [
            'amountPaid' => 450000,
            'method' => 'Transfer Bank',
            'date' => '2026-08-10',
            'notes' => 'Lunas via BCA',
        ]);

        $payRes->assertStatus(200)
            ->assertJsonPath('status', 'Lunas')
            ->assertJsonPath('paidAmount', 450000);

        // Cleanup
        $this->postJson("/api/tenants/{$tenantId}/move-out");
        $this->deleteJson("/api/rooms/{$roomId}");
    }

    /**
     * Test Expenses API
     */
    public function test_expense_crud(): void
    {
        $expenseId = 'exp-test-'.microtime(true);

        $data = [
            'id' => $expenseId,
            'category' => 'Listrik',
            'description' => 'Tagihan Listrik Utama',
            'date' => '2026-08-01',
            'amount' => 500000,
            'notes' => 'Token PLN',
        ];

        $this->postJson('/api/expenses', $data)->assertStatus(201);
        $this->getJson('/api/expenses')->assertStatus(200);
        $this->deleteJson("/api/expenses/{$expenseId}")->assertStatus(200);
    }

    /**
     * Test Complaints API
     */
    public function test_complaint_crud(): void
    {
        $complaintId = 'comp-test-'.microtime(true);

        $data = [
            'id' => $complaintId,
            'tenantId' => 't1',
            'tenantName' => 'Tenant One',
            'roomId' => 'r1',
            'roomNumber' => '101',
            'title' => 'AC Kurang Dingin',
            'category' => 'AC/Kipas',
            'status' => 'Baru',
            'priority' => 'Tinggi',
            'date' => '2026-08-05',
            'description' => 'Freon AC sepertinya habis',
        ];

        $this->postJson('/api/complaints', $data)->assertStatus(201);

        $patchRes = $this->patchJson("/api/complaints/{$complaintId}", [
            'status' => 'Selesai',
            'repairCost' => 150000,
        ]);
        $patchRes->assertStatus(200)
            ->assertJsonPath('status', 'Selesai')
            ->assertJsonPath('repairCost', 150000);

        $this->deleteJson("/api/complaints/{$complaintId}")->assertStatus(200);
    }
}
