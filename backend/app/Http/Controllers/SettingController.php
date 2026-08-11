<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index(Request $request)
    {
        $userId   = $request->user()->id;
        $settings = Setting::where('user_id', $userId)->first();

        if (! $settings) {
            $defaults = [
                'kostName'              => 'StayFlow Residence',
                'address'               => '',
                'ownerName'             => '',
                'whatsapp'              => '',
                'bankAccounts'          => [],
                'defaultDueDateDay'     => 5,
                'reminderTemplate'      => 'Halo {nama}, pengingat tagihan sewa Kamar {kamar} periode {bulan}. Total: Rp {jumlah}. Mohon transfer sebelum tanggal {tanggal}. Terima kasih — {nama_kost}.',
                'dailyWelcomeTemplate'  => 'Selamat Datang di {nama_kost}! Kamar {kamar}. Check-out jam 12:00 WIB.',
                'dailyCheckoutTemplate' => 'Halo {nama}, pengingat waktu check-out Kamar {kamar} adalah hari ini pukul 12:00 WIB. Terima kasih telah menginap di {nama_kost}!',
                'autoWhatsAppReminder'  => false,
                'qrisMerchantId'        => null,
                'enableMultiKost'       => false,
                'checkInTime'           => '14:00',
                'checkOutTime'          => '12:00',
            ];

            Setting::create(['user_id' => $userId, 'data' => $defaults]);

            return response()->json($defaults);
        }

        return response()->json($settings->data ?? []);
    }

    public function update(Request $request)
    {
        $userId = $request->user()->id;

        Setting::updateOrCreate(
            ['user_id' => $userId],
            ['data' => $request->all()]
        );

        return response()->json($request->all());
    }
}
