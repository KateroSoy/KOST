<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('kostos_bills')) {
            return;
        }

        DB::statement("CREATE TABLE kostos_bills (
            id VARCHAR(64) PRIMARY KEY,
            seq INT NOT NULL AUTO_INCREMENT, UNIQUE KEY bills_seq (seq),
            tenantId VARCHAR(64) NOT NULL,
            tenantName VARCHAR(191) NOT NULL DEFAULT '',
            roomId VARCHAR(64) NOT NULL DEFAULT '',
            roomNumber VARCHAR(32) NOT NULL DEFAULT '',
            rentalType VARCHAR(16) NOT NULL DEFAULT 'Bulanan',
            stayDuration INT NOT NULL DEFAULT 1,
            checkInDate VARCHAR(32) NULL,
            checkOutDate VARCHAR(32) NULL,
            period VARCHAR(32) NOT NULL DEFAULT '',
            dueDate VARCHAR(32) NOT NULL DEFAULT '',
            rentAmount INT NOT NULL DEFAULT 0,
            electricityCharge INT NOT NULL DEFAULT 0,
            waterCharge INT NOT NULL DEFAULT 0,
            additionalFee INT NOT NULL DEFAULT 0,
            discount INT NOT NULL DEFAULT 0,
            lateFee INT NOT NULL DEFAULT 0,
            totalAmount INT NOT NULL DEFAULT 0,
            paidAmount INT NOT NULL DEFAULT 0,
            status VARCHAR(16) NOT NULL DEFAULT 'Belum Bayar',
            paymentMethod VARCHAR(64) NULL,
            paymentDate VARCHAR(32) NULL,
            notes TEXT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    }

    public function down(): void
    {
        Schema::dropIfExists('kostos_bills');
    }
};
