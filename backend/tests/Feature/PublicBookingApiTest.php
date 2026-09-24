<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Property;
use App\Models\Room;
use App\Models\WebsiteConfig;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicBookingApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_booking_uses_saved_room_price_and_reaches_owner(): void
    {
        $owner = $this->actingAsOwner();
        Property::create([
            'id' => 'public-prop', 'user_id' => $owner->id, 'name' => 'Public Test',
            'type' => 'Coliving', 'slug' => 'public-test',
        ]);
        Room::create([
            'id' => 'public-room', 'user_id' => $owner->id, 'propertyId' => 'public-prop',
            'number' => 'A01', 'status' => 'Kosong', 'type' => 'Studio',
            'price' => 2500000, 'pricePerMonth' => 2500000,
            'floor' => 1, 'size' => '4x4', 'facilities' => [],
        ]);
        WebsiteConfig::create([
            'user_id' => $owner->id, 'property_id' => 'public-prop',
            'template_id' => 'align', 'subdomain' => 'public-test',
            'headline' => 'Welcome', 'subheadline' => 'Stay', 'about_text' => 'About',
            'accent_color' => '#173B30', 'whatsapp_direct' => '08123456789',
            'sections' => [], 'is_published' => true,
        ]);

        $this->getJson('/api/public/properties/public-prop')
            ->assertOk()->assertJsonCount(1, 'rooms');

        $this->postJson('/api/public/properties/public-prop/bookings', [
            'roomId' => 'public-room', 'guestName' => 'Public Guest',
            'guestPhone' => '081234567890', 'moveInDate' => now()->toDateString(),
            'durationMonths' => 2, 'guestsCount' => 1,
            'totalAmount' => 1, 'depositAmount' => 0,
        ])->assertCreated()->assertJson(['status' => 'Pending']);

        $booking = Booking::where('user_id', $owner->id)->firstOrFail();
        $this->assertSame('Public Guest', $booking->guest_name);
        $this->assertSame('5000000.00', $booking->total_amount);
        $this->assertSame('2500000.00', $booking->deposit_amount);

        Room::where('id', 'public-room')->update(['status' => 'Terisi']);
        $this->getJson('/api/public/properties/public-prop')
            ->assertOk()->assertJsonCount(0, 'rooms');
        $this->postJson('/api/public/properties/public-prop/bookings', [
            'roomId' => 'public-room', 'guestName' => 'Another Guest',
            'guestPhone' => '081234567890', 'moveInDate' => now()->toDateString(),
            'durationMonths' => 1, 'guestsCount' => 1,
        ])->assertUnprocessable();
        $this->assertSame(1, Booking::where('user_id', $owner->id)->count());
    }
}
