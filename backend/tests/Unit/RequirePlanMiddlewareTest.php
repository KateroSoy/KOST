<?php

namespace Tests\Unit;

use App\Http\Middleware\RequirePlan;
use App\Models\User;
use Illuminate\Http\Request;
use Tests\TestCase;

class RequirePlanMiddlewareTest extends TestCase
{
    private function callMiddleware(User $user, string $requiredPlan = 'pro')
    {
        $request = Request::create('/api/_test', 'GET');
        $request->setUserResolver(fn () => $user);

        $middleware = new RequirePlan();
        return $middleware->handle($request, fn ($req) => response()->json(['ok' => true]), $requiredPlan);
    }

    public function test_basic_user_is_blocked_with_plan_locked_body()
    {
        $user = new User(['plan' => 'basic', 'expires_at' => null, 'role' => 'owner']);
        $response = $this->callMiddleware($user);

        $this->assertEquals(403, $response->getStatusCode());
        $body = json_decode($response->getContent(), true);
        $this->assertEquals('PLAN_LOCKED', $body['code']);
        $this->assertEquals('pro', $body['requiredPlan']);
    }

    public function test_permanent_pro_user_passes()
    {
        $user = new User(['plan' => 'pro', 'expires_at' => null, 'role' => 'owner']);
        $response = $this->callMiddleware($user);
        $this->assertEquals(200, $response->getStatusCode());
    }

    public function test_trial_pro_user_within_window_passes()
    {
        $user = new User(['plan' => 'pro', 'expires_at' => now()->addDays(3), 'role' => 'owner']);
        $response = $this->callMiddleware($user);
        $this->assertEquals(200, $response->getStatusCode());
    }

    public function test_expired_trial_user_is_treated_as_basic_and_blocked()
    {
        $user = new User(['plan' => 'pro', 'expires_at' => now()->subDay(), 'role' => 'owner']);
        $response = $this->callMiddleware($user);
        $this->assertEquals(403, $response->getStatusCode());
    }

    public function test_super_admin_always_passes_regardless_of_plan()
    {
        $user = new User(['plan' => 'basic', 'expires_at' => null, 'role' => 'super_admin']);
        $response = $this->callMiddleware($user);
        $this->assertEquals(200, $response->getStatusCode());
    }
}
