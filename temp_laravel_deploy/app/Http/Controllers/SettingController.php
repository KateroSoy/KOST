<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    /**
     * Return the KostSettings object.
     *
     * Seeds a default settings row when none exists yet (first boot).
     */
    public function index()
    {
        $settings = Setting::find(1);

        if (! $settings) {
            // Seed default settings on first boot
            $defaults = [
                'kostName'             => 'Grand StayFlow Stay & Residence',
                'address'              => 'Jl. Dago Asri No. 42, Coblong, Bandung',
                'ownerName'            => 'Pemilik',
                'whatsapp'             => '081234567890',
                'bankAccounts'         => [],
                'defaultDueDateDay'    => 5,
                'reminderTemplate'     => 'Halo {nama}, tagihan sewa Kamar {kamar} periode {bulan} sebesar Rp {jumlah} jatuh tempo {tanggal}. Terima kasih — {nama_kost}.',
                'dailyWelcomeTemplate' => 'Selamat Datang di {nama_kost}! Kamar {kamar}. WiFi: STAYFLOW_GUEST / stay2026. Check-out {checkout}.',
                'dailyCheckoutTemplate'=> 'Halo {nama}, check-out Kamar {kamar} hari ini pukul 12:00 WIB. Terima kasih telah menginap di {nama_kost}!',
                'autoWhatsAppReminder' => false,
                'qrisMerchantId'       => '',
                'enableMultiKost'      => false,
                'checkInTime'          => '14:00',
                'checkOutTime'         => '12:00',
            ];

            Setting::create(['id' => 1, 'data' => $defaults]);

            return response()->json($defaults);
        }

        return response()->json($settings->data ?? []);
    }

    /**
     * Persist the full KostSettings object.
     */
    public function update(Request $request)
    {
        Setting::updateOrCreate(['id' => 1], ['data' => $request->all()]);

        return response()->json($request->all());
    }
}
