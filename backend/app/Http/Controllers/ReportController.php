<?php
// backend/app/Http/Controllers/ReportController.php
namespace App\Http\Controllers;

use App\Models\Bill;
use App\Models\Expense;
use App\Models\Room;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    private const MONTHS = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ];

    private function monthKey(string $month): string
    {
        $parts = explode(' ', $month);
        $index = array_search($parts[0], self::MONTHS, true);
        $monthNum = $index === false ? '06' : str_pad((string) ($index + 1), 2, '0', STR_PAD_LEFT);
        $year = $parts[1] ?? '2026';
        return "{$year}-{$monthNum}";
    }

    private function trendMonths(string $selectedMonth): array
    {
        $parts = explode(' ', $selectedMonth);
        $baseIndex = array_search($parts[0], self::MONTHS, true);
        $baseYear = (int) ($parts[1] ?? 2026);

        if ($baseIndex === false) {
            return [$selectedMonth];
        }

        $result = [];
        for ($i = -1; $i <= 1; $i++) {
            $mi = $baseIndex + $i;
            $yr = $baseYear;
            if ($mi < 0) { $mi = 11; $yr--; }
            if ($mi > 11) { $mi = 0; $yr++; }
            $result[] = self::MONTHS[$mi] . ' ' . $yr;
        }
        return $result;
    }

    public function index(Request $request)
    {
        $userId = $request->user()->id;
        $mode = $request->query('mode', 'month');
        $selectedMonth = $request->query('month', self::MONTHS[5] . ' 2026');
        $startDate = $request->query('startDate');
        $endDate = $request->query('endDate');

        $allBills = Bill::where('user_id', $userId)->get();
        $allExpenses = Expense::where('user_id', $userId)->get();
        $rooms = Room::where('user_id', $userId)->get();

        if ($mode === 'range' && $startDate && $endDate) {
            $activeBills = $allBills->filter(function ($b) use ($startDate, $endDate) {
                $date = $b->paymentDate ?: $b->dueDate;
                return $date >= $startDate && $date <= $endDate;
            });
            $activeExpenses = $allExpenses->filter(fn ($e) => $e->date >= $startDate && $e->date <= $endDate);
        } else {
            $activeBills = $allBills->where('period', $selectedMonth);
            $activeMonthKey = $this->monthKey($selectedMonth);
            $activeExpenses = $allExpenses->filter(fn ($e) => str_starts_with($e->date, $activeMonthKey));
        }

        $totalRevenue = (float) $activeBills->whereIn('status', ['Lunas', 'Sebagian'])->sum('paidAmount');
        $totalCosts = (float) $activeExpenses->sum('amount');
        $outstandingAmount = (float) $activeBills->sum(fn ($b) => $b->totalAmount - $b->paidAmount);

        $paidBillsCount = $activeBills->where('status', 'Lunas')->count();
        $unpaidBillsCount = $activeBills->where('status', '!=', 'Lunas')->count();

        $occupancyRate = $rooms->count() > 0
            ? ($rooms->whereIn('status', ['Terisi', 'Menunggak'])->count() / $rooms->count()) * 100
            : 0;

        $trend = collect($this->trendMonths($selectedMonth))->map(function ($m) use ($allBills, $allExpenses) {
            $mKey = $this->monthKey($m);
            $mBills = $allBills->where('period', $m);
            $mExpenses = $allExpenses->filter(fn ($e) => str_starts_with($e->date, $mKey));

            return [
                'name'    => explode(' ', $m)[0],
                'income'  => (float) $mBills->whereIn('status', ['Lunas', 'Sebagian'])->sum('paidAmount'),
                'expense' => (float) $mExpenses->sum('amount'),
            ];
        })->values();

        $unpaidBills = $activeBills->where('status', '!=', 'Lunas')->map(fn ($b) => [
            'id'            => $b->id,
            'roomNumber'    => $b->roomNumber,
            'tenantName'    => $b->tenantName,
            'paymentMethod' => $b->paymentMethod,
            'status'        => $b->status,
            'remaining'     => (float) ($b->totalAmount - $b->paidAmount),
        ])->values();

        return response()->json([
            'totalRevenue'      => $totalRevenue,
            'totalCosts'        => $totalCosts,
            'actualProfit'      => $totalRevenue - $totalCosts,
            'outstandingAmount' => $outstandingAmount,
            'paidBillsCount'    => $paidBillsCount,
            'unpaidBillsCount'  => $unpaidBillsCount,
            'occupancyRate'     => round($occupancyRate, 2),
            'roomStatusCounts'  => [
                'terisi'    => $rooms->whereIn('status', ['Terisi', 'Menunggak'])->count(),
                'kosong'    => $rooms->where('status', 'Kosong')->count(),
                'perbaikan' => $rooms->where('status', 'Perbaikan')->count(),
            ],
            'trend'       => $trend,
            'unpaidBills' => $unpaidBills,
        ], 200, [], JSON_PRESERVE_ZERO_FRACTION);
    }
}
