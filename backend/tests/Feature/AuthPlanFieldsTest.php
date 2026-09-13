<?php
// backend/tests/Feature/AuthPlanFieldsTest.php
namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthPlanFieldsTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_grants_seven_day_pro_trial_and_exposes_plan_fields()
    {
        $response = $this->postJson('/api/auth/register', [
            'phone'    => '081200000001',
            'password' => 'secret123',
            'name'     => 'Trial User',
            'kostName' => 'Kost Trial',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['token', 'user' => ['id', 'plan', 'effectivePlan', 'expiresAt']])
            ->assertJsonPath('user.plan', 'pro')
            ->assertJsonPath('user.effectivePlan', 'pro');

        $user = User::where('phone', '081200000001')->first();
        $this->assertNotNull($user->expires_at);
        $this->assertTrue($user->expires_at->between(now()->addDays(6), now()->addDays(8)));
    }

    public function test_login_and_me_expose_plan_fields()
    {
        $user = User::create([
            'name' => 'Login User', 'phone' => '081200000002',
            'password' => bcrypt('secret123'), 'role' => 'owner', 'status' => 'active',
            'plan' => 'pro', 'expires_at' => now()->subDay(), 'slug' => 'login-user',
        ]);

        $login = $this->postJson('/api/auth/login', ['phone' => '081200000002', 'password' => 'secret123']);
        $login->assertOk()->assertJsonPath('user.effectivePlan', 'basic');

        $me = $this->actingAs($user, 'sanctum')->getJson('/api/auth/me');
        $me->assertOk()->assertJsonPath('effectivePlan', 'basic')->assertJsonPath('plan', 'pro');
    }
}
