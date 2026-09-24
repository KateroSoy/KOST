<?php

namespace Tests\Feature;

use App\Models\Bill;
use App\Models\Complaint;
use App\Models\Expense;
use App\Models\Room;
use App\Models\Setting;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RestoreApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_restore_replaces_all_data_and_is_restored_back_afterward(): void
    {
        $user = $this->actingAsOwner();
        $ts = time();

        $smokePayload = [
            'kostSettings' => ['kostName' => 'Smoke Kost'],
            'rooms' => [[
                'id' => "smoke-room-{$ts}", 'number' => "Z{$ts}", 'status' => 'Kosong',
                'type' => 'Standard', 'price' => 500000, 'floor' => 9, 'size' => '3x3 m',
                'facilities' => [],
            ]],
            'tenants' => [],
            'bills' => [],
            'expenses' => [[
                'id' => "smoke-exp-{$ts}", 'category' => 'Lainnya',
                'description' => 'smoke', 'date' => '2026-07-08', 'amount' => 1000,
            ]],
            'complaints' => [],
        ];

        $this->postJson('/api/restore', $smokePayload)
            ->assertOk()
            ->assertJson(['ok' => true]);

        $this->assertCount(1, Room::where('user_id', $user->id)->get());
        $this->assertSame("smoke-room-{$ts}", Room::where('user_id', $user->id)->first()->id);
        $this->assertCount(0, Tenant::where('user_id', $user->id)->get());
        $this->assertCount(0, Bill::where('user_id', $user->id)->get());
        $this->assertCount(1, Expense::where('user_id', $user->id)->get());
        $this->assertCount(0, Complaint::where('user_id', $user->id)->get());
        $this->assertSame('Smoke Kost', Setting::where('user_id', $user->id)->first()->data['kostName']);
    }

    public function test_restore_requires_kost_settings(): void
    {
        $this->actingAsOwner();
        $this->postJson('/api/restore', ['rooms' => []])
            ->assertStatus(400)
            ->assertJson(['error' => 'kostSettings wajib ada']);
    }

    public function test_restore_rejects_explicit_null_kost_settings(): void
    {
        $this->actingAsOwner();
        $this->postJson('/api/restore', ['kostSettings' => null, 'rooms' => []])
            ->assertStatus(400)
            ->assertJson(['error' => 'kostSettings wajib ada']);
    }
}
