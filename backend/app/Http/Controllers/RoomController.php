<?php

namespace App\Http\Controllers;

use App\Models\Room;
use Illuminate\Http\Request;

class RoomController extends Controller
{
    public function index()
    {
        return Room::orderBy('seq')->get();
    }

    public function store(Request $request)
    {
        $room = Room::updateOrCreate(['id' => $request->input('id')], $request->all());

        return response()->json($room, 201);
    }

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
