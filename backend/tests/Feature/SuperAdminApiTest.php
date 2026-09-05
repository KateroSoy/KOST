<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Room;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SuperAdminApiTest extends TestCase
{
    use RefreshDatabase;

    protected $superAdmin;
    protected $owner;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->superAdmin = User::create([
            'name' => 'Master Admin',
            'phone' => '080000000000',
            'password' => bcrypt('admin123'),
            'role' => 'super_admin',
            'status' => 'active',
            'plan' => 'pro',
            'slug' => 'master-admin',
        ]);

        $this->owner = User::create([
            'name' => 'Owner Test',
            'phone' => '081111111111',
            'password' => bcrypt('password123'),
            'role' => 'owner',
            'status' => 'active',
            'plan' => 'pro',
            'slug' => 'owner-test',
        ]);
    }

    public function test_owner_cannot_access_super_admin_metrics()
    {
        $response = $this->actingAs($this->owner, 'sanctum')
            ->getJson('/api/admin/metrics');
        
        $response->assertStatus(403);
    }

    public function test_super_admin_can_access_metrics()
    {
        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson('/api/admin/metrics');
        
        $response->assertStatus(200)
            ->assertJsonStructure([
                'totalOwners', 'activeOwners', 'suspendedOwners', 'totalRooms',
                'occupiedRooms', 'totalTenants', 'totalRevenuePaid', 'totalRevenuePending'
            ]);
    }

    public function test_super_admin_can_get_users()
    {
        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson('/api/admin/users');
        
        $response->assertStatus(200);
        $this->assertCount(1, $response->json());
        $this->assertEquals('Owner Test', $response->json()[0]['name']);
    }

    public function test_super_admin_can_update_user_status()
    {
        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->patchJson("/api/admin/users/{$this->owner->id}/status", [
                'status' => 'suspended'
            ]);
        
        $response->assertStatus(200)
            ->assertJson(['ok' => true, 'status' => 'suspended']);

        $this->assertEquals('suspended', $this->owner->fresh()->status);
    }

    public function test_super_admin_can_update_user_plan()
    {
        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->patchJson("/api/admin/users/{$this->owner->id}/plan", [
                'plan' => 'basic'
            ]);
        
        $response->assertStatus(200)
            ->assertJson(['ok' => true, 'plan' => 'basic']);

        $this->assertEquals('basic', $this->owner->fresh()->plan);
    }

    public function test_super_admin_can_destroy_user()
    {
        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->deleteJson("/api/admin/users/{$this->owner->id}");
        
        $response->assertStatus(200)
            ->assertJson(['ok' => true]);

        $this->assertNull(User::find($this->owner->id));
    }
}
