<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Users table
        if (!Schema::hasTable('kostos_users')) {
            DB::statement("CREATE TABLE kostos_users (
                id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(191) NOT NULL,
                phone VARCHAR(64) NOT NULL,
                email VARCHAR(191) NULL,
                password VARCHAR(191) NOT NULL,
                remember_token VARCHAR(100) NULL,
                created_at TIMESTAMP NULL,
                updated_at TIMESTAMP NULL,
                UNIQUE KEY kostos_users_phone_unique (phone)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        }

        // 2. Personal Access Tokens (Sanctum)
        if (!Schema::hasTable('personal_access_tokens')) {
            DB::statement("CREATE TABLE personal_access_tokens (
                id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                tokenable_type VARCHAR(191) NOT NULL,
                tokenable_id BIGINT UNSIGNED NOT NULL,
                name VARCHAR(191) NOT NULL,
                token VARCHAR(64) NOT NULL,
                abilities TEXT NULL,
                last_used_at TIMESTAMP NULL,
                expires_at TIMESTAMP NULL,
                created_at TIMESTAMP NULL,
                updated_at TIMESTAMP NULL,
                UNIQUE KEY personal_access_tokens_token_unique (token),
                KEY personal_access_tokens_tokenable_type_tokenable_id_index (tokenable_type, tokenable_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        }

        // 3. Add user_id to kostos_rooms
        if (Schema::hasTable('kostos_rooms') && !Schema::hasColumn('kostos_rooms', 'user_id')) {
            DB::statement("ALTER TABLE kostos_rooms ADD COLUMN user_id BIGINT UNSIGNED NULL AFTER id");
        }

        // 4. Add user_id to kostos_tenants
        if (Schema::hasTable('kostos_tenants') && !Schema::hasColumn('kostos_tenants', 'user_id')) {
            DB::statement("ALTER TABLE kostos_tenants ADD COLUMN user_id BIGINT UNSIGNED NULL AFTER id");
        }

        // 5. Add user_id to kostos_bills
        if (Schema::hasTable('kostos_bills') && !Schema::hasColumn('kostos_bills', 'user_id')) {
            DB::statement("ALTER TABLE kostos_bills ADD COLUMN user_id BIGINT UNSIGNED NULL AFTER id");
        }

        // 6. Add user_id to kostos_expenses
        if (Schema::hasTable('kostos_expenses') && !Schema::hasColumn('kostos_expenses', 'user_id')) {
            DB::statement("ALTER TABLE kostos_expenses ADD COLUMN user_id BIGINT UNSIGNED NULL AFTER id");
        }

        // 7. Add user_id to kostos_complaints
        if (Schema::hasTable('kostos_complaints') && !Schema::hasColumn('kostos_complaints', 'user_id')) {
            DB::statement("ALTER TABLE kostos_complaints ADD COLUMN user_id BIGINT UNSIGNED NULL AFTER id");
        }

        // 8. Add user_id to kostos_settings (make it multi-user: one settings row per user)
        if (Schema::hasTable('kostos_settings') && !Schema::hasColumn('kostos_settings', 'user_id')) {
            DB::statement("ALTER TABLE kostos_settings ADD COLUMN user_id BIGINT UNSIGNED NULL AFTER id");
            DB::statement("ALTER TABLE kostos_settings MODIFY id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT");
        }
    }

    public function down(): void
    {
        // Safe no-op: only drop new tables, leave columns in place
        Schema::dropIfExists('personal_access_tokens');
        Schema::dropIfExists('kostos_users');
    }
};
