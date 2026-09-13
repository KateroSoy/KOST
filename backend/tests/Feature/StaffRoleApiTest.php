<?php
// backend/tests/Feature/StaffRoleApiTest.php
namespace Tests\Feature;

use App\Models\StaffMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StaffRoleApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_update_staff_role()
    {
        $user = User::create(['name' => 'Owner', 'phone' => '081400000003', 'password' => bcrypt('secret123'), 'role' => 'owner', 'status' => 'active', 'plan' => 'pro', 'slug' => 'owner-staff']);
        $staff = StaffMember::create(['user_id' => $user->id, 'custom_id' => 'st1', 'property_id' => 'prop-1', 'name' => 'Sari', 'role' => 'Staff', 'phone' => '0812', 'email' => 'sari@x.id', 'status' => 'Active']);

        $this->actingAs($user, 'sanctum')
            ->patchJson('/api/staff/st1/role', ['role' => 'Manager'])
            ->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertEquals('Manager', $staff->fresh()->role);
    }
}
