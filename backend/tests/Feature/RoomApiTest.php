<?php

namespace Tests\Feature;

use App\Models\Room;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoomApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_room_crud_endpoints(): void
    {
        $this->actingAsOwner();
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

    public function test_put_edits_room_details(): void
    {
        $this->actingAsOwner();
        $this->postJson('/api/rooms', [
            'id' => 'edit-room', 'number' => 'A1', 'status' => 'Kosong', 'type' => 'Studio',
            'price' => 1000000, 'pricePerMonth' => 1000000, 'floor' => 1, 'size' => '3x3 m', 'facilities' => ['AC'],
        ])->assertCreated();

        $this->putJson('/api/rooms/edit-room', [
            'number' => 'A1-Deluxe', 'type' => 'Deluxe', 'price' => 1800000, 'pricePerMonth' => 1800000,
            'pricePerDay' => 120000, 'floor' => 3, 'size' => '4x5 m', 'facilities' => ['AC', 'Balkon'], 'notes' => 'Renovasi',
        ])->assertOk()->assertJsonFragment(['number' => 'A1-Deluxe', 'type' => 'Deluxe', 'pricePerDay' => 120000]);

        $room = Room::find('edit-room');
        $this->assertSame(1800000, $room->pricePerMonth);
        $this->assertSame(3, $room->floor);
        $this->assertSame(['AC', 'Balkon'], $room->facilities);
        $this->assertSame('Kosong', $room->status);
    }

    public function test_put_cannot_reassign_room_id_or_owner(): void
    {
        $owner = $this->actingAsOwner();
        $other = \App\Models\User::create([
            'name' => 'Other', 'phone' => '0813' . random_int(10000000, 99999999), 'password' => bcrypt('x'),
            'role' => 'owner', 'status' => 'active', 'plan' => 'pro', 'slug' => 'other-' . uniqid(),
        ]);
        $this->postJson('/api/rooms', ['id' => 'mine', 'number' => 'B1', 'status' => 'Kosong', 'type' => 'Studio', 'price' => 1, 'floor' => 1, 'size' => '-', 'facilities' => []])
            ->assertCreated();

        $this->putJson('/api/rooms/mine', ['id' => 'stolen', 'user_id' => $other->id, 'number' => 'B2'])->assertOk();

        $room = Room::find('mine');
        $this->assertNotNull($room);
        $this->assertSame((int) $owner->id, (int) $room->user_id);
        $this->assertSame('B2', $room->number);
        $this->assertNull(Room::find('stolen'));
    }

    public function test_renaming_room_number_updates_its_tenants(): void
    {
        $owner = $this->actingAsOwner();
        $this->postJson('/api/rooms', ['id' => 'r-occ', 'number' => 'C1', 'status' => 'Kosong', 'type' => 'Studio', 'price' => 900000, 'floor' => 1, 'size' => '-', 'facilities' => []])
            ->assertCreated();
        $this->postJson('/api/tenants', [
            'id' => 't-occ', 'name' => 'Penghuni', 'phone' => '081200000001', 'guestType' => 'Bulanan',
            'roomAssigned' => 'C1', 'moveInDate' => now()->toDateString(), 'rentAmount' => 900000, 'status' => 'Belum Bayar',
        ])->assertCreated();

        $this->putJson('/api/rooms/r-occ', ['number' => 'C1-New'])->assertOk();

        $this->assertSame('C1-New', \App\Models\Tenant::find('t-occ')->roomAssigned);
        // Another owner's tenant pointing at a same-named room is untouched.
        $this->assertSame(0, \App\Models\Tenant::where('user_id', '!=', $owner->id)->where('roomAssigned', 'C1-New')->count());
    }

    public function test_cannot_edit_another_owners_room(): void
    {
        $this->actingAsOwner();
        $this->postJson('/api/rooms', ['id' => 'private', 'number' => 'D1', 'status' => 'Kosong', 'type' => 'Studio', 'price' => 1, 'floor' => 1, 'size' => '-', 'facilities' => []])
            ->assertCreated();

        $this->actingAsOwner();
        $this->putJson('/api/rooms/private', ['number' => 'hacked'])->assertNotFound();
        $this->assertSame('D1', Room::find('private')->number);
    }
}
