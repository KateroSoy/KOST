<?php

namespace App\Http\Controllers;

use App\Models\Property;
use Illuminate\Http\Request;

class PropertyController extends Controller
{
    /**
     * List all properties belonging to authenticated user.
     */
    public function index(Request $request)
    {
        return Property::where('user_id', $request->user()->id)
            ->orderBy('seq')
            ->get();
    }

    /**
     * Create or update a property (upsert by id).
     */
    public function store(Request $request)
    {
        $data = $request->all();
        $data['user_id'] = $request->user()->id;

        $id = $data['id'] ?? null;
        if ($id) {
            $property = Property::updateOrCreate(
                ['id' => $id, 'user_id' => $data['user_id']],
                $data
            );
        } else {
            $property = Property::create($data);
        }

        return response()->json($property, 201);
    }

    /**
     * Full update of a property (PUT).
     */
    public function update(Request $request, string $id)
    {
        $property = Property::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (! $property) {
            return response()->json(['error' => 'Properti tidak ditemukan'], 404);
        }

        $property->fill($request->all());
        $property->save();

        return response()->json($property);
    }

    /**
     * Delete a property (scoped to owner).
     */
    public function destroy(Request $request, string $id)
    {
        Property::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->delete();

        return response()->json(['ok' => true]);
    }
}
