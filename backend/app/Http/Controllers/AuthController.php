<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Auto-generate a unique slug from a text string.
     */
    private function makeSlug(string $text): string
    {
        $text = strtolower(trim($text));
        $text = preg_replace('/[^a-z0-9\s-]/', '', $text);
        $text = preg_replace('/[\s-]+/', '-', $text);
        return trim($text, '-') ?: 'pengelola';
    }

    /**
     * Get a unique slug (appends -N if taken).
     */
    private function uniqueSlug(string $base, ?int $excludeId = null): string
    {
        $slug = $this->makeSlug($base);
        $counter = 1;
        $candidate = $slug;

        while (
            User::where('slug', $candidate)
                ->when($excludeId, fn($q) => $q->where('id', '!=', $excludeId))
                ->exists()
        ) {
            $candidate = $slug . '-' . $counter++;
        }

        return $candidate;
    }

    /**
     * Common auth-facing user shape shared by register/login/me.
     */
    private function serializeUser(User $user): array
    {
        return [
            'id'            => $user->id,
            'name'          => $user->name,
            'phone'         => $user->phone,
            'slug'          => $user->slug,
            'role'          => $user->role ?? 'owner',
            'status'        => $user->status ?? 'active',
            'plan'          => $user->plan ?? 'pro',
            'effectivePlan' => $user->effectivePlan(),
            'expiresAt'     => optional($user->expires_at)->toIso8601String(),
        ];
    }

    /**
     * Register a new property owner account (SaaS Customer).
     */
    public function register(Request $request)
    {
        $request->validate([
            'phone'    => 'required|string|min:9|unique:kostos_users,phone',
            'password' => 'required|string|min:6',
            'name'     => 'required|string|max:191',
            'kostName' => 'nullable|string|max:191',
        ]);

        $kostName = $request->kostName ?? ($request->name . ' Kost');
        $slug     = $this->uniqueSlug($kostName);

        $user = User::create([
            'name'       => $request->name,
            'phone'      => $request->phone,
            'slug'       => $slug,
            'role'       => 'owner',
            'status'     => 'active',
            'plan'       => 'pro',
            'expires_at' => now()->addDays(7),
            'email'      => $request->email ?? null,
            'password'   => Hash::make($request->password),
        ]);

        Setting::create([
            'user_id' => $user->id,
            'data'    => [
                'kostName'              => $kostName,
                'address'               => $request->address ?? '',
                'ownerName'             => $request->name,
                'whatsapp'              => $request->phone,
                'checkInTime'           => '14:00',
                'checkOutTime'          => '12:00',
                'bankAccounts'          => [],
                'defaultDueDateDay'     => 5,
                'reminderTemplate'      => 'Halo {nama}, pengingat tagihan sewa Kamar {kamar} periode {bulan}. Total: Rp {jumlah}. Mohon transfer sebelum tanggal {tanggal}. Terima kasih — {nama_kost}.',
                'dailyWelcomeTemplate'  => 'Selamat Datang di {nama_kost}! Kamar {kamar}. Check-out jam 12:00 WIB.',
                'dailyCheckoutTemplate' => 'Halo {nama}, pengingat waktu check-out Kamar {kamar} adalah hari ini pukul 12:00 WIB. Terima kasih telah menginap di {nama_kost}!',
                'autoWhatsAppReminder'  => false,
                'qrisMerchantId'        => null,
                'enableMultiKost'       => false,
            ],
        ]);

        $token = $user->createToken('stayflow-app')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => $this->serializeUser($user),
        ], 201);
    }

    /**
     * Login an existing account (Super Admin or Property Owner).
     */
    public function login(Request $request)
    {
        $request->validate([
            'phone'    => 'required|string',
            'password' => 'required|string',
        ]);

        $user = User::where('phone', $request->phone)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'phone' => ['Nomor WhatsApp atau kata sandi salah.'],
            ]);
        }

        if (($user->status ?? 'active') === 'suspended') {
            return response()->json([
                'error' => 'Akun Anda sedang ditangguhkan oleh Administrator SaaS. Silakan hubungi dukungan pelanggan.'
            ], 403);
        }

        $user->tokens()->delete();
        $token = $user->createToken('stayflow-app')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => $this->serializeUser($user),
        ]);
    }

    /**
     * Logout — revoke current token.
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['ok' => true]);
    }

    /**
     * Return authenticated user info.
     */
    public function me(Request $request)
    {
        $user = $request->user();
        return response()->json(array_merge($this->serializeUser($user), [
            'email' => $user->email,
        ]));
    }

    /**
     * Change authenticated user password.
     */
    public function changePassword(Request $request)
    {
        $request->validate([
            'oldPassword' => 'required|string',
            'newPassword' => 'required|string|min:6',
        ]);

        $user = $request->user();

        if (! Hash::check($request->oldPassword, $user->password)) {
            throw ValidationException::withMessages([
                'oldPassword' => ['Kata sandi lama salah.'],
            ]);
        }

        $user->password = Hash::make($request->newPassword);
        $user->save();

        return response()->json([
            'ok'      => true,
            'message' => 'Kata sandi berhasil diperbarui.',
        ]);
    }
}
