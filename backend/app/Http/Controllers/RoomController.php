<?php

namespace App\Http\Controllers;

use App\Models\Room;
use Illuminate\Http\Request;

class RoomController extends Controller
{
    public function index(Request $request)
    {
        return Room::where('user_id', $request->user()->id)
            ->orderBy('seq')
            ->get();
    }

    public function store(Request $request)
    {
        $data = $request->all();
        $data['user_id'] = $request->user()->id;

        $room = Room::updateOrCreate(
            ['id' => $data['id'], 'user_id' => $data['user_id']],
            $data
        );

        return response()->json($room, 201);
    }

    public function update(Request $request, string $id)
    {
        $room = Room::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (! $room) {
            return response()->json(['error' => 'Kamar tidak ditemukan'], 404);
        }

        $room->fill($request->all());
        $room->save();

        return response()->json($room);
    }

    /**
     * Full room update (PUT) — alias to update for complete record edits.
     */
    public function replace(Request $request, string $id)
    {
        return $this->update($request, $id);
    }

    public function destroy(Request $request, string $id)
    {
        Room::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->delete();

        return response()->json(['ok' => true]);
    }
}
