<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('kostos_rooms')) {
            return;
        }

        DB::statement("CREATE TABLE kostos_rooms (
            id VARCHAR(64) PRIMARY KEY,
            seq INT NOT NULL AUTO_INCREMENT, UNIQUE KEY rooms_seq (seq),
            number VARCHAR(32) NOT NULL,
            status VARCHAR(16) NOT NULL DEFAULT 'Kosong',
            housekeepingStatus VARCHAR(32) NOT NULL DEFAULT 'Bersih',
            type VARCHAR(16) NOT NULL DEFAULT 'Standard',
            price INT NOT NULL DEFAULT 0,
            pricePerDay INT NOT NULL DEFAULT 0,
            pricePerMonth INT NOT NULL DEFAULT 0,
            pricePerWeek INT NOT NULL DEFAULT 0,
            rentalTypesAllowed JSON,
            floor INT NOT NULL DEFAULT 1,
            size VARCHAR(32) NOT NULL DEFAULT '',
            maxGuests INT NOT NULL DEFAULT 2,
            facilities JSON,
            images JSON,
            description TEXT NULL,
            tenantId VARCHAR(64) NULL,
            notes TEXT NULL,
            lastMaintenanceDate VARCHAR(32) NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    }

    public function down(): void
    {
        Schema::dropIfExists('kostos_rooms');
    }
};
