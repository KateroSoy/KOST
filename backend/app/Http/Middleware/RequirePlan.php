<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequirePlan
{
    public function handle(Request $request, Closure $next, string $requiredPlan): Response
    {
        $user = $request->user();

        if ($user && ($user->role ?? 'owner') !== 'super_admin' && $user->effectivePlan() !== $requiredPlan) {
            return response()->json([
                'error'        => 'Fitur ini memerlukan paket Pro.',
                'code'         => 'PLAN_LOCKED',
                'requiredPlan' => $requiredPlan,
            ], 403);
        }

        return $next($request);
    }
}
