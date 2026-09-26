<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Everything the dashboard needs in one request.
 *
 * Shared hosting caps concurrent MySQL connections per account (~10). Loading the
 * dashboard as 11 parallel GETs exceeded that on its own and produced 500s, so this
 * serves the same payloads from the existing index() methods over one connection.
 */
class BootstrapController extends Controller
{
    private const PRO_RESOURCES = [
        'bookings' => BookingController::class,
        'operations' => OperationTaskController::class,
        'staff' => StaffMemberController::class,
        'websiteConfigs' => WebsiteConfigController::class,
    ];

    public function index(Request $request)
    {
        $user = $request->user();
        // Same rule as the RequirePlan middleware guarding the pro endpoints.
        $planLocked = ($user->role ?? 'owner') !== 'super_admin' && $user->effectivePlan() !== 'pro';

        // Bills first: its index() marks overdue tenants, so tenants read afterwards are current.
        $bills = $this->payload(BillController::class, $request);
        $data = [
            'settings' => $this->payload(SettingController::class, $request),
            'rooms' => $this->payload(RoomController::class, $request),
            'tenants' => $this->payload(TenantController::class, $request),
            'bills' => $bills,
            'expenses' => $this->payload(ExpenseController::class, $request),
            'complaints' => $this->payload(ComplaintController::class, $request),
            'properties' => $this->payload(PropertyController::class, $request),
        ];
        foreach (self::PRO_RESOURCES as $key => $controller) {
            $data[$key] = $planLocked ? null : $this->payload($controller, $request);
        }
        $data['planLocked'] = $planLocked;

        return response()->json($data);
    }

    /** Decoded JSON exactly as the resource's own GET endpoint would serialize it. */
    private function payload(string $controller, Request $request): mixed
    {
        $result = app($controller)->index($request);
        $response = $result instanceof Response ? $result : response()->json($result);

        return json_decode($response->getContent(), true);
    }
}
