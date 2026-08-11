<?php

namespace App\Http\Controllers;

use App\Models\Room;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\Request;

class PublicController extends Controller
{
    /**
     * Public owner landing page data — NO AUTH required.
     * Returns settings + available rooms for a given owner slug.
     *
     * GET /api/public/owner/{slug}
     */
    public function show(string $slug)
    {
        $user = User::where('slug', $slug)->first();

        if (! $user) {
            return response()->json(['error' => 'Pengelola tidak ditemukan'], 404);
        }

        $settings = Setting::where('user_id', $user->id)->first();
        $settingsData = $settings?->data ?? [
            'kostName'    => $user->name . ' Kost',
            'ownerName'   => $user->name,
            'whatsapp'    => $user->phone,
            'address'     => '',
            'checkInTime' => '14:00',
            'checkOutTime'=> '12:00',
        ];

        // Only expose Kosong / available rooms publicly
        $rooms = Room::where('user_id', $user->id)->get()->map(function ($room) {
            return [
                'id'              => $room->id,
                'number'          => $room->number,
                'status'          => $room->status,
                'type'            => $room->type,
                'price'           => $room->price,
                'pricePerDay'     => $room->pricePerDay,
                'pricePerMonth'   => $room->pricePerMonth,
                'pricePerWeek'    => $room->pricePerWeek,
                'rentalTypesAllowed' => $room->rentalTypesAllowed,
                'floor'           => $room->floor,
                'size'            => $room->size,
                'maxGuests'       => $room->maxGuests,
                'facilities'      => $room->facilities,
                'images'          => $room->images,
                'description'     => $room->description,
            ];
        });

        return response()->json([
            'owner' => [
                'name'  => $user->name,
                'slug'  => $user->slug,
                'phone' => $user->phone,
            ],
            'settings' => $settingsData,
            'rooms'    => $rooms,
        ]);
    }
}
