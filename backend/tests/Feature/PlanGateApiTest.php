<?php
// backend/tests/Feature/PlanGateApiTest.php
namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PlanGateApiTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(string $plan, ?string $role = 'owner', $expiresAt = null): User
    {
        static $seq = 0;
        $seq++;
        return User::create([
            'name' => "User $seq", 'phone' => "08130000{$seq}0", 'password' => bcrypt('secret123'),
            'role' => $role, 'status' => 'active', 'plan' => $plan, 'expires_at' => $expiresAt,
            'slug' => "user-$seq",
        ]);
    }

    public static function proRouteProvider(): array
    {
        return [
            'bookings'        => ['/api/bookings'],
            'operations'      => ['/api/operations'],
            'staff'           => ['/api/staff'],
            'website-configs' => ['/api/website-configs'],
        ];
    }

    /** @dataProvider proRouteProvider */
    public function test_basic_user_gets_403_on_pro_route($route)
    {
        $user = $this->makeUser('basic');
        $this->actingAs($user, 'sanctum')->getJson($route)
            ->assertStatus(403)->assertJsonPath('code', 'PLAN_LOCKED');
    }

    /** @dataProvider proRouteProvider */
    public function test_pro_user_gets_200_on_pro_route($route)
    {
        $user = $this->makeUser('pro');
        $this->actingAs($user, 'sanctum')->getJson($route)->assertStatus(200);
    }

    /** @dataProvider proRouteProvider */
    public function test_expired_trial_user_gets_403_on_pro_route($route)
    {
        $user = $this->makeUser('pro', 'owner', now()->subDay());
        $this->actingAs($user, 'sanctum')->getJson($route)
            ->assertStatus(403)->assertJsonPath('code', 'PLAN_LOCKED');
    }

    /** @dataProvider proRouteProvider */
    public function test_super_admin_gets_200_on_pro_route_regardless_of_plan($route)
    {
        $user = $this->makeUser('basic', 'super_admin');
        $this->actingAs($user, 'sanctum')->getJson($route)->assertStatus(200);
    }
}
