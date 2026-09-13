<?php
// backend/tests/Feature/BookingStatusApiTest.php
namespace Tests\Feature;

use App\Models\Booking;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookingStatusApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_update_booking_status()
    {
        $user = User::create(['name' => 'Owner', 'phone' => '081400000001', 'password' => bcrypt('secret123'), 'role' => 'owner', 'status' => 'active', 'plan' => 'pro', 'slug' => 'owner-bk']);
        $booking = Booking::create(['user_id' => $user->id, 'custom_id' => 'bk1', 'property_id' => 'prop-1', 'room_type' => 'Standard', 'guest_name' => 'Andi', 'guest_phone' => '0812', 'move_in_date' => '2026-06-01', 'duration_months' => 1, 'guests_count' => 1, 'total_amount' => 1000000, 'deposit_amount' => 0, 'source' => 'Website', 'status' => 'Pending']);

        $this->actingAs($user, 'sanctum')
            ->patchJson('/api/bookings/bk1/status', ['status' => 'Confirmed'])
            ->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertEquals('Confirmed', $booking->fresh()->status);
    }
}
