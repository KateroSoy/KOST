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
            'phone' => '080000000099',
            'password' => bcrypt('admin123'),
            'role' => 'super_admin',
            'status' => 'active',
            'plan' => 'pro',
            'slug' => 'test-master-admin',
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

    public function test_super_admin_setting_plan_clears_expires_at()
    {
        $this->owner->plan = 'pro';
        $this->owner->expires_at = now()->addDays(3);
        $this->owner->save();

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->patchJson("/api/admin/users/{$this->owner->id}/plan", ['plan' => 'pro']);

        $response->assertStatus(200)->assertJsonPath('effectivePlan', 'pro');
        $this->assertNull($this->owner->fresh()->expires_at);
    }

    public function test_super_admin_setting_basic_plan_also_clears_expires_at()
    {
        $this->owner->plan = 'pro';
        $this->owner->expires_at = now()->addDays(3);
        $this->owner->save();

        $this->actingAs($this->superAdmin, 'sanctum')
            ->patchJson("/api/admin/users/{$this->owner->id}/plan", ['plan' => 'basic'])
            ->assertStatus(200);

        $fresh = $this->owner->fresh();
        $this->assertEquals('basic', $fresh->plan);
        $this->assertNull($fresh->expires_at);
    }

    public function test_users_listing_exposes_effective_plan_and_expiry()
    {
        $this->owner->plan = 'pro';
        $this->owner->expires_at = now()->subDay();
        $this->owner->save();

        $response = $this->actingAs($this->superAdmin, 'sanctum')->getJson('/api/admin/users');

        $response->assertStatus(200);
        $this->assertEquals('basic', $response->json()[0]['effectivePlan']);
        $this->assertNotNull($response->json()[0]['expiresAt']);
    }
}
