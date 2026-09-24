<?php
namespace App\Http\Controllers;
use App\Models\StaffMember;
use Illuminate\Http\Request;

class StaffMemberController extends Controller {
    public function index(Request $request) {
        $data = StaffMember::where('user_id', $request->user()->id)->get();
        return response()->json($data->map(function($i) {
            return [
                'id' => $i->custom_id,
                'propertyId' => $i->property_id,
                'name' => $i->name,
                'role' => $i->role,
                'phone' => $i->phone,
                'email' => $i->email,
                'status' => $i->status,
            ];
        }));
    }
    public function store(Request $request) {
        $data = $request->validate([
            'id' => 'required|string',
            'propertyId' => 'sometimes|string',
            'name' => 'required|string',
            'role' => 'required|string',
            'phone' => 'required|string',
            'email' => 'required|string',
            'status' => 'required|string',
        ]);
        StaffMember::updateOrCreate(
            ['user_id' => $request->user()->id, 'custom_id' => $data['id']],
            [
                'property_id' => $data['propertyId'] ?? 'prop-1',
                'name' => $data['name'],
                'role' => $data['role'],
                'phone' => $data['phone'],
                'email' => $data['email'],
                'status' => $data['status'],
            ]
        );
        return response()->json(['success' => true]);
    }
    public function destroy(Request $request, $id) {
        StaffMember::where('user_id', $request->user()->id)->where('custom_id', $id)->delete();
        return response()->json(['success' => true]);
    }
    public function updateRole(Request $request, $id) {
        StaffMember::where('user_id', $request->user()->id)->where('custom_id', $id)->update(['role' => $request->input('role')]);
        return response()->json(['success' => true]);
    }
}
