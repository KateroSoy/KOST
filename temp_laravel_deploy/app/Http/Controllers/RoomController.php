<?php

namespace App\Http\Controllers;

use App\Models\Room;
use Illuminate\Http\Request;

class RoomController extends Controller
{
    /**
     * List all rooms ordered by their auto-increment seq.
     */
    public function index()
    {
        return Room::orderBy('seq')->get();
    }

    /**
     * Create or upsert a room.
     * Accepts all fields including the new dual-stay pricing and housekeeping fields.
     */
    public function store(Request $request)
    {
        $room = Room::updateOrCreate(
            ['id' => $request->input('id')],
            $request->all()
        );

        return response()->json($room, 201);
    }

    /**
     * Partially update a room (PATCH).
     *
     * Used by:
     * - handleUpdateRoomStatus → { status }
     * - handleUpdateHousekeepingStatus → { housekeepingStatus }
     * - Move-out cleanup → { status: 'Kosong', housekeepingStatus: 'Kotor', tenantId: null }
     * - Full room edit from RoomsView → all fields
     */
    public function update(Request $request, string $id)
    {
        $room = Room::find($id);

        if (! $room) {
            return response()->json(['error' => 'Kamar tidak ditemukan'], 404);
        }

        $room->fill($request->all());
        $room->save();

        return response()->json($room);
    }

    public function destroy(string $id)
    {
        Room::destroy($id);

        return response()->json(['ok' => true]);
    }
}
