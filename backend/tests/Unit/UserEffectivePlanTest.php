<?php
// backend/tests/Unit/UserEffectivePlanTest.php
namespace Tests\Unit;

use App\Models\User;
use Tests\TestCase;

class UserEffectivePlanTest extends TestCase
{
    public function test_pro_with_no_expiry_stays_pro()
    {
        $user = new User(['plan' => 'pro', 'expires_at' => null]);
        $this->assertEquals('pro', $user->effectivePlan());
    }

    public function test_pro_with_future_expiry_stays_pro()
    {
        $user = new User(['plan' => 'pro', 'expires_at' => now()->addDay()]);
        $this->assertEquals('pro', $user->effectivePlan());
    }

    public function test_pro_with_past_expiry_becomes_basic()
    {
        $user = new User(['plan' => 'pro', 'expires_at' => now()->subDay()]);
        $this->assertEquals('basic', $user->effectivePlan());
    }

    public function test_basic_plan_ignores_expiry()
    {
        $user = new User(['plan' => 'basic', 'expires_at' => now()->addDay()]);
        $this->assertEquals('basic', $user->effectivePlan());
    }
}
