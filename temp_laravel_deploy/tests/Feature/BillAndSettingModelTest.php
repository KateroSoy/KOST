<?php

namespace Tests\Feature;

use App\Models\Bill;
use App\Models\Setting;
use Tests\TestCase;

class BillAndSettingModelTest extends TestCase
{
    public function test_bill_can_be_created_found_and_deleted(): void
    {
        $id = 'smoke-bill-'.time();

        Bill::create([
            'id' => $id,
            'tenantId' => 'smoke-tenant-x',
            'tenantName' => 'Smoke Tester',
            'roomId' => 'smoke-room-x',
            'roomNumber' => 'Z1',
            'period' => 'Juli 2026',
            'dueDate' => '2026-07-05',
            'rentAmount' => 500000,
            'electricityCharge' => 0,
            'waterCharge' => 0,
            'additionalFee' => 0,
            'discount' => 0,
            'lateFee' => 0,
            'totalAmount' => 500000,
            'paidAmount' => 0,
            'status' => 'Belum Bayar',
        ]);

        $this->assertNotNull(Bill::find($id));

        Bill::find($id)->delete();
        $this->assertNull(Bill::find($id));
    }

    public function test_setting_default_due_date_day_reads_the_existing_seeded_row(): void
    {
        // kostos_settings has one row (id=1), seeded by the Express backend —
        // this only reads it, never modifies it.
        $this->assertGreaterThan(0, Setting::defaultDueDateDay());
    }
}
