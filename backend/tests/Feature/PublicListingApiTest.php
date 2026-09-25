<?php
// backend/tests/Feature/PublicListingApiTest.php
namespace Tests\Feature;

use App\Models\Property;
use App\Models\Room;
use App\Models\User;
use App\Models\WebsiteConfig;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicListingApiTest extends TestCase
{
    use RefreshDatabase;

    private int $n = 0;

    private function listing(array $prop, array $rooms = [], bool $published = true): void
    {
        $this->n++;
        $owner = User::create(['name' => 'Owner', 'phone' => '08150000000' . $this->n, 'password' => bcrypt('secret123'), 'role' => 'owner', 'status' => 'active', 'plan' => 'pro', 'slug' => 'owner-' . $this->n]);
        $id = 'prop-' . $this->n;
        Property::create(array_merge(['id' => $id, 'user_id' => $owner->id, 'name' => 'Prop ' . $this->n, 'type' => 'Kost', 'slug' => 'p' . $this->n, 'city' => '', 'address' => '', 'whatsapp' => '0812SECRET', 'bankAccounts' => [['bank' => 'BCA', 'number' => '999']]], $prop));
        foreach ($rooms as $i => $room) {
            Room::create(array_merge(['id' => "$id-r$i", 'user_id' => $owner->id, 'propertyId' => $id, 'number' => "0$i", 'status' => 'Kosong', 'type' => 'Studio', 'price' => 2000000, 'floor' => 1, 'size' => '3x3', 'facilities' => []], $room));
        }
        WebsiteConfig::create(['user_id' => $owner->id, 'property_id' => $id, 'template_id' => 'align', 'subdomain' => 'sub' . $this->n, 'headline' => 'H', 'subheadline' => 'S', 'about_text' => 'A', 'accent_color' => '#000', 'whatsapp_direct' => '0812', 'sections' => [], 'is_published' => $published]);
    }

    public function test_lists_only_published_properties_without_private_fields()
    {
        $this->listing(['name' => 'Visible Kost'], [[]]);
        $this->listing(['name' => 'Hidden Kost'], [[]], false);

        $res = $this->getJson('/api/public/properties')->assertOk();

        $this->assertSame(['Visible Kost'], array_column($res->json(), 'name'));
        $this->assertStringNotContainsString('SECRET', $res->getContent());
        $this->assertStringNotContainsString('bankAccounts', $res->getContent());
    }

    public function test_location_query_matches_city_name_or_address_case_insensitively()
    {
        $this->listing(['name' => 'A', 'city' => 'Yogyakarta']);
        $this->listing(['name' => 'Kost Jogja Asri', 'city' => '']);
        $this->listing(['name' => 'C', 'address' => 'Jl. Kaliurang, YOGYAKARTA']);
        $this->listing(['name' => 'D', 'city' => 'Bali']);

        $names = array_column($this->getJson('/api/public/properties?q=yogyakarta')->assertOk()->json(), 'name');
        sort($names);
        $this->assertSame(['A', 'C'], $names);
        $this->assertSame(['Kost Jogja Asri'], array_column($this->getJson('/api/public/properties?q=jogja')->json(), 'name'));
    }

    public function test_filters_by_type()
    {
        $this->listing(['name' => 'K', 'type' => 'Kost']);
        $this->listing(['name' => 'V', 'type' => 'Villa']);

        $this->assertSame(['V'], array_column($this->getJson('/api/public/properties?type=Villa')->json(), 'name'));
    }

    public function test_filters_by_rental_duration_using_available_rooms()
    {
        // Explicit rental types win; otherwise a positive price for that period counts.
        $this->listing(['name' => 'Daily only'], [['rentalTypesAllowed' => ['Harian'], 'pricePerDay' => 150000]]);
        $this->listing(['name' => 'Monthly by price'], [['pricePerMonth' => 2000000]]);
        $this->listing(['name' => 'Both by price'], [['pricePerMonth' => 3000000, 'pricePerDay' => 200000]]);
        $this->listing(['name' => 'Daily but full'], [['status' => 'Terisi', 'pricePerDay' => 100000]]);

        $daily = array_column($this->getJson('/api/public/properties?duration=Harian')->json(), 'name');
        sort($daily);
        $this->assertSame(['Both by price', 'Daily only'], $daily);

        $monthly = array_column($this->getJson('/api/public/properties?duration=Bulanan')->json(), 'name');
        sort($monthly);
        $this->assertSame(['Both by price', 'Monthly by price'], $monthly);
    }

    public function test_reports_available_rooms_and_lowest_prices()
    {
        $this->listing(['name' => 'P', 'startPriceMonth' => 9999999], [
            ['pricePerMonth' => 3000000, 'pricePerDay' => 200000],
            ['pricePerMonth' => 2500000, 'pricePerDay' => 180000],
            ['status' => 'Terisi', 'pricePerMonth' => 1000000],
        ]);

        $row = $this->getJson('/api/public/properties')->json()[0];
        $this->assertSame(2, $row['availableRooms']);
        $this->assertSame(2500000, $row['startPriceMonth']);
        $this->assertSame(180000, $row['startPriceDay']);
        $this->assertEqualsCanonicalizing(['Bulanan', 'Harian'], $row['rentalTypes']);
    }
}
