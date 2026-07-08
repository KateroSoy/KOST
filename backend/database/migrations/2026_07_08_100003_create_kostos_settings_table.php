<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // kostos_settings already exists (created by the Express backend,
        // see server/db.js) — guard keeps this idempotent on the shared DB.
        if (Schema::hasTable('kostos_settings')) {
            return;
        }

        Schema::create('kostos_settings', function (Blueprint $table) {
            $table->tinyInteger('id')->primary();
            $table->json('data');
        });
    }

    public function down(): void
    {
        // No-op: this migration never truly "owns" table creation on the
        // shared remote DB (up() already skips creation when the table
        // pre-exists), so rollback must never drop the real kostos_settings
        // table and its live data.
    }
};
