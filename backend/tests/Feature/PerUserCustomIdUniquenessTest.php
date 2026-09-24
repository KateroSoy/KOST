<?php
// Regression test: custom_id used to have a bare global unique() constraint
// instead of being scoped to (user_id, custom_id). Two different owners
// creating a record with the same client-generated id (e.g. both hit the
// same millisecond with `${prefix}-${Date.now()}`) would collide on the
// process-wide unique index and the second insert would throw a 500.
namespace Tests\Feature;

use App\Models\Booking;
use App\Models\OperationTask;
use App\Models\StaffMember;
use App\Models\WebsiteConfig;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PerUserCustomIdUniquenessTest extends TestCase
{
    use RefreshDatabase;

    public function test_two_owners_can_create_a_booking_with_the_same_custom_id()
    {
        $ownerA = $this->actingAsOwner(['phone' => '081300000101', 'slug' => 'owner-a-bk']);
        $this->postJson('/api/bookings', [
            'id' => 'book-same-id', 'propertyId' => 'prop-1', 'roomType' => 'Standard',
            'guestName' => 'Andi', 'guestPhone' => '0811', 'moveInDate' => '2026-06-01',
            'durationMonths' => 1, 'guestsCount' => 1, 'totalAmount' => 1000000,
            'depositAmount' => 0, 'source' => 'Website', 'status' => 'Pending',
        ])->assertOk();

        $ownerB = $this->actingAsOwner(['phone' => '081300000102', 'slug' => 'owner-b-bk']);
        $this->postJson('/api/bookings', [
            'id' => 'book-same-id', 'propertyId' => 'prop-1', 'roomType' => 'Deluxe',
            'guestName' => 'Budi', 'guestPhone' => '0812', 'moveInDate' => '2026-06-02',
            'durationMonths' => 2, 'guestsCount' => 2, 'totalAmount' => 2000000,
            'depositAmount' => 0, 'source' => 'Website', 'status' => 'Pending',
        ])->assertOk();

        $this->assertSame(1, Booking::where('user_id', $ownerA->id)->where('custom_id', 'book-same-id')->count());
        $this->assertSame(1, Booking::where('user_id', $ownerB->id)->where('custom_id', 'book-same-id')->count());
    }

    public function test_two_owners_can_create_an_operation_task_with_the_same_custom_id()
    {
        $ownerA = $this->actingAsOwner(['phone' => '081300000201', 'slug' => 'owner-a-op']);
        $this->postJson('/api/operations', [
            'id' => 'task-same-id', 'propertyId' => 'prop-1', 'type' => 'Cleaning', 'title' => 'A',
            'roomNumber' => '101', 'priority' => 'Sedang', 'status' => 'Open', 'assignedTo' => 'Budi',
        ])->assertOk();

        $ownerB = $this->actingAsOwner(['phone' => '081300000202', 'slug' => 'owner-b-op']);
        $this->postJson('/api/operations', [
            'id' => 'task-same-id', 'propertyId' => 'prop-1', 'type' => 'Maintenance', 'title' => 'B',
            'roomNumber' => '102', 'priority' => 'Tinggi', 'status' => 'Open', 'assignedTo' => 'Siti',
        ])->assertOk();

        $this->assertSame(1, OperationTask::where('user_id', $ownerA->id)->where('custom_id', 'task-same-id')->count());
        $this->assertSame(1, OperationTask::where('user_id', $ownerB->id)->where('custom_id', 'task-same-id')->count());
    }

    public function test_two_owners_can_create_a_staff_member_with_the_same_custom_id()
    {
        $ownerA = $this->actingAsOwner(['phone' => '081300000301', 'slug' => 'owner-a-st']);
        $this->postJson('/api/staff', [
            'id' => 'staff-same-id', 'name' => 'Andi', 'role' => 'Staff', 'phone' => '0811', 'email' => 'a@x.com', 'status' => 'Active',
        ])->assertOk();

        $ownerB = $this->actingAsOwner(['phone' => '081300000302', 'slug' => 'owner-b-st']);
        $this->postJson('/api/staff', [
            'id' => 'staff-same-id', 'name' => 'Budi', 'role' => 'Manager', 'phone' => '0812', 'email' => 'b@x.com', 'status' => 'Active',
        ])->assertOk();

        $this->assertSame(1, StaffMember::where('user_id', $ownerA->id)->where('custom_id', 'staff-same-id')->count());
        $this->assertSame(1, StaffMember::where('user_id', $ownerB->id)->where('custom_id', 'staff-same-id')->count());
    }

    public function test_two_owners_can_have_a_website_config_for_the_same_property_id()
    {
        $ownerA = $this->actingAsOwner(['phone' => '081300000401', 'slug' => 'owner-a-wc']);
        $this->postJson('/api/website-configs', [
            'propertyId' => 'prop-1', 'templateId' => 'align', 'subdomain' => 'owner-a-sub',
            'headline' => 'H', 'subheadline' => 'S', 'aboutText' => 'A', 'accentColor' => '#000',
            'whatsappDirect' => '0811', 'sections' => [],
        ])->assertOk();

        $ownerB = $this->actingAsOwner(['phone' => '081300000402', 'slug' => 'owner-b-wc']);
        $this->postJson('/api/website-configs', [
            'propertyId' => 'prop-1', 'templateId' => 'urban', 'subdomain' => 'owner-b-sub',
            'headline' => 'H2', 'subheadline' => 'S2', 'aboutText' => 'A2', 'accentColor' => '#fff',
            'whatsappDirect' => '0812', 'sections' => [],
        ])->assertOk();

        $this->assertSame(1, WebsiteConfig::where('user_id', $ownerA->id)->where('property_id', 'prop-1')->count());
        $this->assertSame(1, WebsiteConfig::where('user_id', $ownerB->id)->where('property_id', 'prop-1')->count());
    }
}
