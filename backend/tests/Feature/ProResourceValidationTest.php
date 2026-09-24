<?php
// Regression test: store() on the pro-gated resources used to read required
// NOT NULL fields straight off $request->all() with no validation, so a
// missing field crashed with a raw 500 DB error instead of a clean 422.
namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProResourceValidationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAsOwner();
    }

    public function test_booking_store_rejects_missing_required_field_with_422()
    {
        $this->postJson('/api/bookings', ['id' => 'b1', 'roomType' => 'Standard'])
            ->assertStatus(422);
    }

    public function test_operation_task_store_rejects_missing_required_field_with_422()
    {
        $this->postJson('/api/operations', ['id' => 't1', 'type' => 'Cleaning'])
            ->assertStatus(422);
    }

    public function test_staff_member_store_rejects_missing_required_field_with_422()
    {
        $this->postJson('/api/staff', ['id' => 's1', 'name' => 'Andi'])
            ->assertStatus(422);
    }

    public function test_website_config_store_rejects_missing_required_field_with_422()
    {
        $this->postJson('/api/website-configs', ['propertyId' => 'prop-1'])
            ->assertStatus(422);
    }
}
