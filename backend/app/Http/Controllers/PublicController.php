<?php

namespace App\Http\Controllers;

use App\Models\Room;
use App\Models\Booking;
use App\Models\Property;
use App\Models\Setting;
use App\Models\User;
use App\Models\WebsiteConfig;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PublicController extends Controller
{
    /**
     * Public catalog of properties whose website is published — NO AUTH required.
     * GET /api/public/properties?q=&type=&duration=Bulanan|Harian
     */
    public function index(Request $request)
    {
        $q = mb_strtolower(trim((string) $request->query('q', '')));
        $type = trim((string) $request->query('type', ''));
        $duration = $request->query('duration');
        if (! in_array($duration, ['Bulanan', 'Harian'], true)) $duration = null;

        $published = WebsiteConfig::where('is_published', true)->get(['user_id', 'property_id']);
        if ($published->isEmpty()) return response()->json([]);

        $properties = Property::whereIn('id', $published->pluck('property_id'))
            ->when($type !== '', fn ($query) => $query->where('type', $type))
            ->get()
            // The config must belong to the property's owner, not just share its id.
            ->filter(fn ($p) => $published->contains(fn ($c) => $c->property_id === $p->id && (int) $c->user_id === (int) $p->user_id))
            ->filter(fn ($p) => $q === '' || collect([$p->name, $p->city, $p->address])
                ->contains(fn ($field) => str_contains(mb_strtolower((string) $field), $q)));
        if ($properties->isEmpty()) return response()->json([]);

        $ownerIds = $properties->pluck('user_id')->unique();
        $propertyCounts = Property::whereIn('user_id', $ownerIds)->selectRaw('user_id, count(*) as n')
            ->groupBy('user_id')->pluck('n', 'user_id');
        $rooms = Room::whereIn('user_id', $ownerIds)->where('status', 'Kosong')->get();

        $rows = $properties->map(function ($p) use ($rooms, $propertyCounts) {
            // Mirrors property(): rooms without a propertyId belong to single-property owners.
            $own = $rooms->filter(fn ($r) => (int) $r->user_id === (int) $p->user_id
                && ($r->propertyId === $p->id || ($r->propertyId === null && (int) ($propertyCounts[$p->user_id] ?? 0) === 1)));
            $supports = function ($room, string $kind) {
                $allowed = $room->rentalTypesAllowed ?? [];
                if (! empty($allowed)) return in_array($kind, $allowed, true);
                return $kind === 'Harian' ? $room->pricePerDay > 0 : ($room->pricePerMonth ?: $room->price) > 0;
            };
            $monthly = $own->filter(fn ($r) => $supports($r, 'Bulanan'));
            $daily = $own->filter(fn ($r) => $supports($r, 'Harian'));

            return [
                'id' => $p->id,
                'name' => $p->name,
                'type' => $p->type,
                'city' => $p->city,
                'address' => $p->address,
                'coverImage' => $p->coverImage ?: ($own->first()?->images[0] ?? null),
                'facilities' => array_slice($p->facilities ?? [], 0, 6),
                'availableRooms' => $own->count(),
                'startPriceMonth' => $monthly->map(fn ($r) => $r->pricePerMonth ?: $r->price)->min() ?? $p->startPriceMonth,
                'startPriceDay' => $daily->min('pricePerDay') ?? $p->startPriceDay,
                'rentalTypes' => array_values(array_filter([
                    $monthly->isNotEmpty() ? 'Bulanan' : null,
                    $daily->isNotEmpty() ? 'Harian' : null,
                ])),
            ];
        })
            ->filter(fn ($row) => $duration === null || in_array($duration, $row['rentalTypes'], true))
            ->sortByDesc('availableRooms')
            ->take(60)
            ->values();

        return response()->json($rows);
    }

    public function property(string $id)
    {
        $property = Property::find($id);
        if (! $property) return response()->json(['error' => 'Properti tidak ditemukan'], 404);

        $config = WebsiteConfig::where('user_id', $property->user_id)
            ->where('property_id', $id)->where('is_published', true)->first();
        if (! $config) return response()->json(['error' => 'Website belum dipublikasikan'], 404);

        $includeLegacyRooms = Property::where('user_id', $property->user_id)->count() === 1;
        $rooms = Room::where('user_id', $property->user_id)
            ->where('status', 'Kosong')
            ->where(function ($query) use ($id, $includeLegacyRooms) {
                $query->where('propertyId', $id);
                if ($includeLegacyRooms) $query->orWhereNull('propertyId');
            })->get();

        return response()->json([
            'property' => $property,
            'rooms' => $rooms,
            'websiteConfig' => [
                'propertyId' => $id,
                'templateId' => $config->template_id,
                'headline' => $config->headline,
                'subheadline' => $config->subheadline,
                'aboutText' => $config->about_text,
                'accentColor' => $config->accent_color,
                'showAvailabilityWidget' => (bool) $config->show_availability_widget,
                'showReviews' => (bool) $config->show_reviews,
                'showFaq' => (bool) $config->show_faq,
                'whatsappDirect' => $config->whatsapp_direct,
                'sections' => $config->sections ?? [],
                'isPublished' => true,
            ],
        ]);
    }

    public function book(Request $request, string $id)
    {
        $data = $request->validate([
            'roomId' => 'required|string',
            'guestName' => 'required|string|max:191',
            'guestPhone' => 'required|string|min:9|max:64',
            'guestEmail' => 'nullable|email|max:191',
            'moveInDate' => 'required|date_format:Y-m-d|after_or_equal:today',
            'durationMonths' => 'required|integer|min:1|max:24',
            'guestsCount' => 'required|integer|min:1|max:20',
            'notes' => 'nullable|string|max:2000',
        ]);
        $property = Property::find($id);
        if (! $property) return response()->json(['error' => 'Properti tidak ditemukan'], 404);
        $published = WebsiteConfig::where('user_id', $property->user_id)
            ->where('property_id', $id)->where('is_published', true)->exists();
        if (! $published) return response()->json(['error' => 'Website belum dipublikasikan'], 404);

        $room = Room::where('id', $data['roomId'])->where('user_id', $property->user_id)
            ->where('status', 'Kosong')->first();
        if (! $room) return response()->json(['error' => 'Kamar tidak tersedia'], 422);
        $includeLegacyRoom = $room->propertyId === null
            && Property::where('user_id', $property->user_id)->count() === 1;
        if ($room->propertyId !== $id && ! $includeLegacyRoom) {
            return response()->json(['error' => 'Kamar tidak tersedia'], 422);
        }

        $monthlyRate = $room->pricePerMonth ?: $room->price;
        $booking = Booking::create([
            'user_id' => $property->user_id,
            'property_id' => $id,
            'custom_id' => 'web-'.Str::uuid(),
            'room_id' => $room->id,
            'room_type' => $room->type,
            'room_number' => $room->number,
            'guest_name' => $data['guestName'],
            'guest_phone' => $data['guestPhone'],
            'guest_email' => $data['guestEmail'] ?? null,
            'move_in_date' => $data['moveInDate'],
            'duration_months' => $data['durationMonths'],
            'guests_count' => $data['guestsCount'],
            'total_amount' => $monthlyRate * $data['durationMonths'],
            'deposit_amount' => $monthlyRate,
            'source' => 'Website',
            'status' => 'Pending',
            'notes' => $data['notes'] ?? null,
        ]);

        return response()->json(['id' => $booking->custom_id, 'status' => 'Pending'], 201);
    }
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
        $rooms = Room::where('user_id', $user->id)->where('status', 'Kosong')->get()->map(function ($room) {
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
