<?php
// backend/tests/Feature/ReportApiTest.php
namespace Tests\Feature;

use App\Models\Bill;
use App\Models\Expense;
use App\Models\Room;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $pro;
    protected User $basic;

    protected function setUp(): void
    {
        parent::setUp();

        $this->pro = User::create([
            'name' => 'Pro Owner', 'phone' => '081300000001', 'password' => bcrypt('secret123'),
            'role' => 'owner', 'status' => 'active', 'plan' => 'pro', 'slug' => 'pro-owner',
        ]);

        $this->basic = User::create([
            'name' => 'Basic Owner', 'phone' => '081300000002', 'password' => bcrypt('secret123'),
            'role' => 'owner', 'status' => 'active', 'plan' => 'basic', 'slug' => 'basic-owner',
        ]);

        Room::create(['id' => 'r1', 'user_id' => $this->pro->id, 'number' => '101', 'status' => 'Terisi', 'type' => 'Standard', 'price' => 1000000, 'floor' => 1, 'size' => '3x3', 'facilities' => []]);
        Room::create(['id' => 'r2', 'user_id' => $this->pro->id, 'number' => '102', 'status' => 'Kosong', 'type' => 'Standard', 'price' => 1000000, 'floor' => 1, 'size' => '3x3', 'facilities' => []]);

        Bill::create([
            'id' => 'b1', 'user_id' => $this->pro->id, 'tenantId' => 't1', 'tenantName' => 'Andi',
            'roomId' => 'r1', 'roomNumber' => '101', 'period' => 'Juni 2026', 'dueDate' => '2026-06-05',
            'rentAmount' => 1000000, 'electricityCharge' => 0, 'waterCharge' => 0, 'additionalFee' => 0,
            'discount' => 0, 'lateFee' => 0, 'totalAmount' => 1000000, 'paidAmount' => 1000000,
            'status' => 'Lunas', 'paymentMethod' => 'Transfer', 'paymentDate' => '2026-06-04',
        ]);
        Bill::create([
            'id' => 'b2', 'user_id' => $this->pro->id, 'tenantId' => 't2', 'tenantName' => 'Budi',
            'roomId' => 'r2', 'roomNumber' => '102', 'period' => 'Juni 2026', 'dueDate' => '2026-06-05',
            'rentAmount' => 1000000, 'electricityCharge' => 0, 'waterCharge' => 0, 'additionalFee' => 0,
            'discount' => 0, 'lateFee' => 0, 'totalAmount' => 1000000, 'paidAmount' => 400000,
            'status' => 'Sebagian',
        ]);

        Expense::create(['id' => 'e1', 'user_id' => $this->pro->id, 'category' => 'Listrik', 'description' => 'PLN', 'date' => '2026-06-10', 'amount' => 300000]);
    }

    public function test_basic_user_is_blocked()
    {
        $this->actingAs($this->basic, 'sanctum')
            ->getJson('/api/reports?mode=month&month=Juni+2026')
            ->assertStatus(403)
            ->assertJsonPath('code', 'PLAN_LOCKED');
    }

    public function test_pro_user_gets_month_aggregate_matching_expected_totals()
    {
        $response = $this->actingAs($this->pro, 'sanctum')
            ->getJson('/api/reports?mode=month&month=Juni+2026');

        $response->assertStatus(200)
            ->assertJsonPath('totalRevenue', 1400000.0)
            ->assertJsonPath('totalCosts', 300000.0)
            ->assertJsonPath('actualProfit', 1100000.0)
            ->assertJsonPath('outstandingAmount', 600000.0)
            ->assertJsonPath('paidBillsCount', 1)
            ->assertJsonPath('unpaidBillsCount', 1)
            ->assertJsonPath('occupancyRate', 50.0)
            ->assertJsonPath('roomStatusCounts.terisi', 1)
            ->assertJsonPath('roomStatusCounts.kosong', 1)
            ->assertJsonCount(1, 'unpaidBills');

        $this->assertEquals('102', $response->json('unpaidBills.0.roomNumber'));
        $this->assertEquals(600000.0, $response->json('unpaidBills.0.remaining'));
    }

    public function test_pro_user_gets_range_aggregate()
    {
        $response = $this->actingAs($this->pro, 'sanctum')
            ->getJson('/api/reports?mode=range&startDate=2026-06-01&endDate=2026-06-30');

        $response->assertStatus(200)
            ->assertJsonPath('totalRevenue', 1400000.0)
            ->assertJsonPath('totalCosts', 300000.0);
    }
}
