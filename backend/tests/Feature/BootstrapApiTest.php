<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BootstrapApiTest extends TestCase
{
    use RefreshDatabase;

    private const KEYS = ['settings', 'rooms', 'tenants', 'bills', 'expenses', 'complaints', 'properties', 'bookings', 'operations', 'staff', 'websiteConfigs'];

    public function test_requires_auth(): void
    {
        $this->getJson('/api/bootstrap')->assertUnauthorized();
    }

    public function test_returns_every_resource_matching_individual_endpoints(): void
    {
        $this->actingAsOwner();
        $this->postJson('/api/properties', ['id' => 'p1', 'name' => 'Kost A', 'type' => 'Kost'])->assertCreated();
        $this->postJson('/api/rooms', ['id' => 'r1', 'propertyId' => 'p1', 'number' => 'A1', 'status' => 'Kosong', 'type' => 'Studio', 'price' => 1000000, 'floor' => 1, 'size' => '3x3 m', 'facilities' => ['AC']])->assertCreated();
        $this->postJson('/api/tenants', ['id' => 't1', 'name' => 'Budi', 'phone' => '081200000001', 'guestType' => 'Bulanan', 'roomAssigned' => 'A1', 'moveInDate' => now()->toDateString(), 'rentAmount' => 1000000, 'status' => 'Belum Bayar'])->assertCreated();
        $this->postJson('/api/expenses', ['id' => 'e1', 'category' => 'Listrik', 'description' => 'Token', 'date' => now()->toDateString(), 'amount' => 100000])->assertCreated();
        $this->postJson('/api/complaints', ['id' => 'c1', 'title' => 'AC', 'category' => 'AC', 'status' => 'Baru', 'priority' => 'Tinggi', 'date' => now()->toDateString(), 'description' => 'Bocor'])->assertCreated();
        $this->postJson('/api/staff', ['id' => 's1', 'propertyId' => 'p1', 'name' => 'Ani', 'role' => 'Staff', 'phone' => '0813', 'email' => 'a@x.id', 'status' => 'Active'])->assertOk();

        $boot = $this->getJson('/api/bootstrap')->assertOk()->assertJsonStructure(self::KEYS)->json();

        $this->assertFalse($boot['planLocked']);
        $this->assertSame($this->getJson('/api/settings')->json(), $boot['settings']);
        foreach (['rooms', 'tenants', 'bills', 'expenses', 'complaints', 'properties', 'bookings', 'operations', 'staff'] as $key) {
            $this->assertSame($this->getJson("/api/{$key}")->json(), $boot[$key], "bootstrap.{$key} differs from /api/{$key}");
        }
        $this->assertSame($this->getJson('/api/website-configs')->json(), $boot['websiteConfigs']);
        $this->assertCount(1, $boot['bills'], 'tenant check-in auto-bill is included');
        $this->assertSame('A1', $boot['rooms'][0]['number']);
    }

    public function test_pro_resources_are_null_when_plan_locked(): void
    {
        $this->actingAsOwner(['plan' => 'free']);

        $boot = $this->getJson('/api/bootstrap')->assertOk()->json();

        $this->assertTrue($boot['planLocked']);
        foreach (['bookings', 'operations', 'staff', 'websiteConfigs'] as $key) {
            $this->assertNull($boot[$key], "{$key} must be null for a locked plan");
        }
        $this->assertSame([], $boot['rooms']);
    }

    public function test_only_returns_own_data(): void
    {
        $this->actingAsOwner();
        $this->postJson('/api/rooms', ['id' => 'mine', 'number' => 'X1', 'status' => 'Kosong', 'type' => 'Studio', 'price' => 1, 'floor' => 1, 'size' => '-', 'facilities' => []])->assertCreated();

        $this->actingAsOwner();
        $this->assertSame([], $this->getJson('/api/bootstrap')->json('rooms'));
    }
}
