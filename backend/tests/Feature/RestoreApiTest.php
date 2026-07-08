<?php

namespace Tests\Feature;

use App\Models\Bill;
use App\Models\Complaint;
use App\Models\Expense;
use App\Models\Room;
use App\Models\Setting;
use App\Models\Tenant;
use Tests\TestCase;

class RestoreApiTest extends TestCase
{
    public function test_restore_replaces_all_data_and_is_restored_back_afterward(): void
    {
        // Snapshot real data BEFORE anything else runs.
        $snapshot = [
            'kostSettings' => Setting::find(1)->data,
            'rooms' => Room::orderBy('seq')->get()->toArray(),
            'tenants' => Tenant::orderBy('seq')->get()->toArray(),
            'bills' => Bill::orderBy('seq')->get()->toArray(),
            'expenses' => Expense::orderBy('seq')->get()->toArray(),
            'complaints' => Complaint::orderBy('seq')->get()->toArray(),
        ];

        $ts = time();

        try {
            $smokePayload = [
                'kostSettings' => $snapshot['kostSettings'],
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

            $this->assertCount(1, Room::all());
            $this->assertSame("smoke-room-{$ts}", Room::first()->id);
            $this->assertCount(0, Tenant::all());
            $this->assertCount(0, Bill::all());
            $this->assertCount(1, Expense::all());
            $this->assertCount(0, Complaint::all());
        } finally {
            // ALWAYS restore the real snapshot, even if an assertion above failed.
            $this->postJson('/api/restore', $snapshot);
        }

        $this->assertCount(count($snapshot['rooms']), Room::all());
        $this->assertCount(count($snapshot['tenants']), Tenant::all());
        $this->assertCount(count($snapshot['bills']), Bill::all());
        $this->assertCount(count($snapshot['expenses']), Expense::all());
        $this->assertCount(count($snapshot['complaints']), Complaint::all());
        $this->assertSame($snapshot['kostSettings']['kostName'], Setting::find(1)->data['kostName']);
    }

    public function test_restore_requires_kost_settings(): void
    {
        $this->postJson('/api/restore', ['rooms' => []])
            ->assertStatus(400)
            ->assertJson(['error' => 'kostSettings wajib ada']);
    }
}
