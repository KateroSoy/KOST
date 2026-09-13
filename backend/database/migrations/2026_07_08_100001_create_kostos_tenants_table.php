<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('kostos_tenants')) {
            return;
        }

        if (DB::connection()->getDriverName() === 'sqlite') {
            DB::statement("CREATE TABLE kostos_tenants (
                id VARCHAR(64) PRIMARY KEY,
                seq INTEGER,
                name VARCHAR(191) NOT NULL,
                phone VARCHAR(32) NOT NULL DEFAULT '',
                email VARCHAR(191) NOT NULL DEFAULT '',
                guestType VARCHAR(16) NOT NULL DEFAULT 'Bulanan',
                checkInDate VARCHAR(32) NULL,
                checkOutDate VARCHAR(32) NULL,
                idType VARCHAR(16) NOT NULL DEFAULT 'KTP',
                vehicleNumber VARCHAR(32) NULL,
                totalGuests INT NOT NULL DEFAULT 1,
                bookingOrigin VARCHAR(32) NOT NULL DEFAULT 'Walk-in',
                emergencyContact JSON,
                idNumber VARCHAR(64) NOT NULL DEFAULT '',
                roomAssigned VARCHAR(64) NOT NULL DEFAULT '',
                moveInDate VARCHAR(32) NOT NULL DEFAULT '',
                rentAmount INT NOT NULL DEFAULT 0,
                deposit INT NOT NULL DEFAULT 0,
                status VARCHAR(16) NOT NULL DEFAULT 'Belum Bayar',
                notes TEXT NULL,
                idPhotoUrl TEXT NULL
            )");
            return;
        }

        DB::statement("CREATE TABLE kostos_tenants (
            id VARCHAR(64) PRIMARY KEY,
            seq INT NOT NULL AUTO_INCREMENT, UNIQUE KEY tenants_seq (seq),
            name VARCHAR(191) NOT NULL,
            phone VARCHAR(32) NOT NULL DEFAULT '',
            email VARCHAR(191) NOT NULL DEFAULT '',
            guestType VARCHAR(16) NOT NULL DEFAULT 'Bulanan',
            checkInDate VARCHAR(32) NULL,
            checkOutDate VARCHAR(32) NULL,
            idType VARCHAR(16) NOT NULL DEFAULT 'KTP',
            vehicleNumber VARCHAR(32) NULL,
            totalGuests INT NOT NULL DEFAULT 1,
            bookingOrigin VARCHAR(32) NOT NULL DEFAULT 'Walk-in',
            emergencyContact JSON,
            idNumber VARCHAR(64) NOT NULL DEFAULT '',
            roomAssigned VARCHAR(64) NOT NULL DEFAULT '',
            moveInDate VARCHAR(32) NOT NULL DEFAULT '',
            rentAmount INT NOT NULL DEFAULT 0,
            deposit INT NOT NULL DEFAULT 0,
            status VARCHAR(16) NOT NULL DEFAULT 'Belum Bayar',
            notes TEXT NULL,
            idPhotoUrl TEXT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    }

    public function down(): void
    {
        Schema::dropIfExists('kostos_tenants');
    }
};
