<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('kostos_expenses')) {
            return;
        }

        DB::statement("CREATE TABLE kostos_expenses (
            id VARCHAR(64) PRIMARY KEY,
            seq INT NOT NULL AUTO_INCREMENT, UNIQUE KEY expenses_seq (seq),
            category VARCHAR(32) NOT NULL,
            description TEXT NOT NULL,
            date VARCHAR(32) NOT NULL DEFAULT '',
            amount INT NOT NULL DEFAULT 0,
            notes TEXT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    }

    public function down(): void
    {
        Schema::dropIfExists('kostos_expenses');
    }
};
