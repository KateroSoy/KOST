<?php
namespace App\Http\Controllers;
use App\Models\Booking;
use Illuminate\Http\Request;

class BookingController extends Controller {
    public function index(Request $request) {
        $data = Booking::where('user_id', $request->user()->id)->get();
        return response()->json($data->map(function($i) {
            return [
                'id' => $i->custom_id,
                'propertyId' => $i->property_id,
                'roomId' => $i->room_id,
                'roomType' => $i->room_type,
                'roomNumber' => $i->room_number,
                'guestName' => $i->guest_name,
                'guestPhone' => $i->guest_phone,
                'guestEmail' => $i->guest_email,
                'moveInDate' => $i->move_in_date,
                'moveOutDate' => $i->move_out_date,
                'durationMonths' => (int) $i->duration_months,
                'guestsCount' => (int) $i->guests_count,
                'totalAmount' => (float) $i->total_amount,
                'depositAmount' => (float) $i->deposit_amount,
                'source' => $i->source,
                'status' => $i->status,
                'notes' => $i->notes,
                'createdAt' => $i->created_at ? $i->created_at->format('Y-m-d') : date('Y-m-d'),
            ];
        }));
    }
    public function store(Request $request) {
        $data = $request->all();
        Booking::updateOrCreate(
            ['user_id' => $request->user()->id, 'custom_id' => $data['id']],
            [
                'property_id' => $data['propertyId'] ?? 'prop-1',
                'room_id' => $data['roomId'] ?? null,
                'room_type' => $data['roomType'],
                'room_number' => $data['roomNumber'] ?? null,
                'guest_name' => $data['guestName'],
                'guest_phone' => $data['guestPhone'],
                'guest_email' => $data['guestEmail'] ?? null,
                'move_in_date' => $data['moveInDate'],
                'move_out_date' => $data['moveOutDate'] ?? null,
                'duration_months' => $data['durationMonths'],
                'guests_count' => $data['guestsCount'],
                'total_amount' => $data['totalAmount'],
                'deposit_amount' => $data['depositAmount'],
                'source' => $data['source'],
                'status' => $data['status'],
                'notes' => $data['notes'] ?? null,
            ]
        );
        return response()->json(['success' => true]);
    }
    public function destroy(Request $request, $id) {
        Booking::where('user_id', $request->user()->id)->where('custom_id', $id)->delete();
        return response()->json(['success' => true]);
    }
    public function updateStatus(Request $request, $id) {
        Booking::where('user_id', $request->user()->id)->where('custom_id', $id)->update(['status' => $request->input('status')]);
        return response()->json(['success' => true]);
    }
}
