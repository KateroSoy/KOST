<?php

namespace Tests;

use App\Models\User;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * Create a pro-plan owner and authenticate subsequent requests as them.
     */
    protected function actingAsOwner(array $attrs = []): User
    {
        $user = User::create(array_merge([
            'name' => 'Test Owner',
            'phone' => '0812' . random_int(10000000, 99999999),
            'password' => bcrypt('secret123'),
            'role' => 'owner',
            'status' => 'active',
            'plan' => 'pro',
            'slug' => 'test-owner-' . uniqid(),
        ], $attrs));

        $this->actingAs($user, 'sanctum');

        return $user;
    }
}
