<?php

namespace Tests\Feature;

use App\Models\Room;
use Tests\TestCase;

class RoomApiTest extends TestCase
{
    public function test_room_crud_endpoints(): void
    {
        $id = 'smoke-room-'.time();

        $this->postJson('/api/rooms', [
            'id' => $id,
            'number' => 'Z98',
            'status' => 'Kosong',
            'type' => 'Standard',
            'price' => 500000,
            'floor' => 9,
            'size' => '3x3 m',
            'facilities' => ['WiFi'],
        ])->assertCreated();

        $list = $this->getJson('/api/rooms')->assertOk()->json();
        $this->assertTrue(collect($list)->contains(
            fn ($r) => $r['id'] === $id && $r['facilities'][0] === 'WiFi'
        ));

        $this->patchJson("/api/rooms/{$id}", ['status' => 'Perbaikan'])
            ->assertOk()
            ->assertJsonFragment(['status' => 'Perbaikan']);

        $this->patchJson('/api/rooms/does-not-exist', ['status' => 'Perbaikan'])
            ->assertNotFound()
            ->assertJson(['error' => 'Kamar tidak ditemukan']);

        $this->deleteJson("/api/rooms/{$id}")
            ->assertOk()
            ->assertJson(['ok' => true]);

        $this->assertNull(Room::find($id));
    }
}
