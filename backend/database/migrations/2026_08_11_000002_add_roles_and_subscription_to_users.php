<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $isSqlite = DB::connection()->getDriverName() === 'sqlite';

        if (Schema::hasTable('kostos_users')) {
            if (! Schema::hasColumn('kostos_users', 'role')) {
                DB::statement($isSqlite
                    ? "ALTER TABLE kostos_users ADD COLUMN role VARCHAR(32) NOT NULL DEFAULT 'owner'"
                    : "ALTER TABLE kostos_users ADD COLUMN role VARCHAR(32) NOT NULL DEFAULT 'owner' AFTER slug");
            }
            if (! Schema::hasColumn('kostos_users', 'status')) {
                DB::statement($isSqlite
                    ? "ALTER TABLE kostos_users ADD COLUMN status VARCHAR(32) NOT NULL DEFAULT 'active'"
                    : "ALTER TABLE kostos_users ADD COLUMN status VARCHAR(32) NOT NULL DEFAULT 'active' AFTER role");
            }
            if (! Schema::hasColumn('kostos_users', 'plan')) {
                DB::statement($isSqlite
                    ? "ALTER TABLE kostos_users ADD COLUMN plan VARCHAR(32) NOT NULL DEFAULT 'pro'"
                    : "ALTER TABLE kostos_users ADD COLUMN plan VARCHAR(32) NOT NULL DEFAULT 'pro' AFTER status");
            }
            if (! Schema::hasColumn('kostos_users', 'expires_at')) {
                DB::statement($isSqlite
                    ? "ALTER TABLE kostos_users ADD COLUMN expires_at DATETIME NULL"
                    : "ALTER TABLE kostos_users ADD COLUMN expires_at DATETIME NULL AFTER plan");
            }
        }

        // Seed default Super Admin account if it does not exist
        $superAdminPhone = '080000000000';
        $exists = DB::table('kostos_users')->where('phone', $superAdminPhone)->exists();
        if (! $exists) {
            $adminId = DB::table('kostos_users')->insertGetId([
                'name'       => 'Master Admin SaaS',
                'phone'      => $superAdminPhone,
                'slug'       => 'master-admin',
                'role'       => 'super_admin',
                'status'     => 'active',
                'plan'       => 'pro',
                'email'      => 'admin@stayflow.id',
                'password'   => Hash::make('admin123'),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Add default setting row for Super Admin
            DB::table('kostos_settings')->insert([
                'user_id' => $adminId,
                'data'    => json_encode([
                    'kostName'              => 'StayFlow Platform HQ',
                    'address'               => 'SaaS Management Portal',
                    'ownerName'             => 'Master Admin',
                    'whatsapp'              => $superAdminPhone,
                    'checkInTime'           => '14:00',
                    'checkOutTime'          => '12:00',
                    'bankAccounts'          => [],
                    'defaultDueDateDay'     => 5,
                    'reminderTemplate'      => '',
                    'dailyWelcomeTemplate'  => '',
                    'dailyCheckoutTemplate' => '',
                    'autoWhatsAppReminder'  => false,
                    'qrisMerchantId'        => null,
                    'enableMultiKost'       => true,
                ]),
            ]);
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('kostos_users')) {
            if (Schema::hasColumn('kostos_users', 'role')) {
                DB::statement("ALTER TABLE kostos_users DROP COLUMN role");
            }
            if (Schema::hasColumn('kostos_users', 'status')) {
                DB::statement("ALTER TABLE kostos_users DROP COLUMN status");
            }
            if (Schema::hasColumn('kostos_users', 'plan')) {
                DB::statement("ALTER TABLE kostos_users DROP COLUMN plan");
            }
            if (Schema::hasColumn('kostos_users', 'expires_at')) {
                DB::statement("ALTER TABLE kostos_users DROP COLUMN expires_at");
            }
        }
    }
};
