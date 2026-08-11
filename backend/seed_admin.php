<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

try {
    // Add columns if missing
    if (! \Illuminate\Support\Facades\Schema::hasColumn('kostos_users', 'role')) {
        DB::statement("ALTER TABLE kostos_users ADD COLUMN role VARCHAR(32) NOT NULL DEFAULT 'owner' AFTER slug");
    }
    if (! \Illuminate\Support\Facades\Schema::hasColumn('kostos_users', 'status')) {
        DB::statement("ALTER TABLE kostos_users ADD COLUMN status VARCHAR(32) NOT NULL DEFAULT 'active' AFTER role");
    }
    if (! \Illuminate\Support\Facades\Schema::hasColumn('kostos_users', 'plan')) {
        DB::statement("ALTER TABLE kostos_users ADD COLUMN plan VARCHAR(32) NOT NULL DEFAULT 'pro' AFTER status");
    }
    if (! \Illuminate\Support\Facades\Schema::hasColumn('kostos_users', 'expires_at')) {
        DB::statement("ALTER TABLE kostos_users ADD COLUMN expires_at DATETIME NULL AFTER plan");
    }

    DB::table('kostos_users')->updateOrInsert(
        ['phone' => '080000000000'],
        [
            'name'       => 'Master Admin SaaS',
            'slug'       => 'master-admin',
            'role'       => 'super_admin',
            'status'     => 'active',
            'plan'       => 'pro',
            'password'   => Hash::make('admin123'),
            'created_at' => now(),
            'updated_at' => now(),
        ]
    );

    echo "SUCCESS: Super Admin Seeded & Migration Applied!\n";
} catch (\Throwable $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
