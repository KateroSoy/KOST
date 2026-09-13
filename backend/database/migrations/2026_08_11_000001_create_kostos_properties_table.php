<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('kostos_properties')) {
            return;
        }

        if (DB::connection()->getDriverName() === 'sqlite') {
            DB::statement("CREATE TABLE kostos_properties (
                id VARCHAR(64) PRIMARY KEY,
                seq INTEGER,
                user_id INTEGER NOT NULL,
                name VARCHAR(191) NOT NULL DEFAULT '',
                type VARCHAR(64) NOT NULL DEFAULT 'Kost',
                slug VARCHAR(191) NOT NULL DEFAULT '',
                address TEXT NULL,
                city VARCHAR(191) NULL,
                description TEXT NULL,
                coverImage VARCHAR(512) NULL,
                images JSON NULL,
                facilities JSON NULL,
                whatsapp VARCHAR(64) NULL,
                ownerName VARCHAR(191) NULL,
                checkInTime VARCHAR(10) NULL DEFAULT '14:00',
                checkOutTime VARCHAR(10) NULL DEFAULT '12:00',
                bankAccounts JSON NULL,
                qrisMerchantId VARCHAR(191) NULL,
                startPriceDay INT NULL DEFAULT 0,
                startPriceMonth INT NULL DEFAULT 0
            )");
            DB::statement("CREATE INDEX kostos_properties_user_id_index ON kostos_properties (user_id)");
            return;
        }

        DB::statement("CREATE TABLE kostos_properties (
            id VARCHAR(64) PRIMARY KEY,
            seq INT NOT NULL AUTO_INCREMENT, UNIQUE KEY properties_seq (seq),
            user_id BIGINT UNSIGNED NOT NULL,
            name VARCHAR(191) NOT NULL DEFAULT '',
            type VARCHAR(64) NOT NULL DEFAULT 'Kost',
            slug VARCHAR(191) NOT NULL DEFAULT '',
            address TEXT NULL,
            city VARCHAR(191) NULL,
            description TEXT NULL,
            coverImage VARCHAR(512) NULL,
            images JSON NULL,
            facilities JSON NULL,
            whatsapp VARCHAR(64) NULL,
            ownerName VARCHAR(191) NULL,
            checkInTime VARCHAR(10) NULL DEFAULT '14:00',
            checkOutTime VARCHAR(10) NULL DEFAULT '12:00',
            bankAccounts JSON NULL,
            qrisMerchantId VARCHAR(191) NULL,
            startPriceDay INT NULL DEFAULT 0,
            startPriceMonth INT NULL DEFAULT 0,
            INDEX kostos_properties_user_id_index (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    }

    public function down(): void
    {
        Schema::dropIfExists('kostos_properties');
    }
};
