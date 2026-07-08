<?php

namespace Tests\Feature;

use App\Models\Room;
use Tests\TestCase;

class RoomModelTest extends TestCase
{
    public function test_room_can_be_created_found_and_deleted(): void
    {
        $id = 'smoke-room-'.time();

        $room = Room::create([
            'id' => $id,
            'number' => 'Z99',
            'status' => 'Kosong',
            'type' => 'Standard',
            'price' => 500000,
            'floor' => 9,
            'size' => '3x3 m',
            'facilities' => ['WiFi'],
        ]);

        $this->assertSame($id, $room->id);

        $found = Room::find($id);
        $this->assertNotNull($found);
        $this->assertSame(['WiFi'], $found->facilities);

        $found->delete();
        $this->assertNull(Room::find($id));
    }
}
