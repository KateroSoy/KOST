<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('kostos_complaints')) {
            return;
        }

        DB::statement("CREATE TABLE kostos_complaints (
            id VARCHAR(64) PRIMARY KEY,
            seq INT NOT NULL AUTO_INCREMENT, UNIQUE KEY complaints_seq (seq),
            tenantId VARCHAR(64) NOT NULL DEFAULT '',
            tenantName VARCHAR(191) NOT NULL DEFAULT '',
            roomId VARCHAR(64) NOT NULL DEFAULT '',
            roomNumber VARCHAR(32) NOT NULL DEFAULT '',
            title TEXT NOT NULL,
            category VARCHAR(32) NOT NULL,
            status VARCHAR(16) NOT NULL DEFAULT 'Baru',
            priority VARCHAR(16) NOT NULL DEFAULT 'Sedang',
            date VARCHAR(32) NOT NULL DEFAULT '',
            description TEXT NOT NULL,
            repairCost INT NULL,
            notes TEXT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    }

    public function down(): void
    {
        Schema::dropIfExists('kostos_complaints');
    }
};
