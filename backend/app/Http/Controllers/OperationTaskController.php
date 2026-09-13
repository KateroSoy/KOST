<?php
namespace App\Http\Controllers;
use App\Models\OperationTask;
use Illuminate\Http\Request;

class OperationTaskController extends Controller {
    public function index(Request $request) {
        $data = OperationTask::where('user_id', $request->user()->id)->get();
        return response()->json($data->map(function($i) {
            return [
                'id' => $i->custom_id,
                'propertyId' => $i->property_id,
                'type' => $i->type,
                'title' => $i->title,
                'roomNumber' => $i->room_number,
                'priority' => $i->priority,
                'status' => $i->status,
                'assignedTo' => $i->assigned_to,
                'estimatedCost' => (float) $i->estimated_cost,
                'notes' => $i->notes,
                'createdAt' => $i->created_at ? $i->created_at->format('Y-m-d') : date('Y-m-d'),
            ];
        }));
    }
    public function store(Request $request) {
        $data = $request->all();
        OperationTask::updateOrCreate(
            ['user_id' => $request->user()->id, 'custom_id' => $data['id']],
            [
                'property_id' => $data['propertyId'] ?? 'prop-1',
                'type' => $data['type'],
                'title' => $data['title'],
                'room_number' => $data['roomNumber'],
                'priority' => $data['priority'],
                'status' => $data['status'],
                'assigned_to' => $data['assignedTo'],
                'estimated_cost' => $data['estimatedCost'] ?? 0,
                'notes' => $data['notes'] ?? null,
            ]
        );
        return response()->json(['success' => true]);
    }
    public function destroy(Request $request, $id) {
        OperationTask::where('user_id', $request->user()->id)->where('custom_id', $id)->delete();
        return response()->json(['success' => true]);
    }
    public function updateStatus(Request $request, $id) {
        OperationTask::where('user_id', $request->user()->id)->where('custom_id', $id)->update(['status' => $request->input('status')]);
        return response()->json(['success' => true]);
    }
}
