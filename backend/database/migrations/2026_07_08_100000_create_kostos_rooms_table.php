<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // kostos_rooms already exists (created by the Express backend, see
        // server/db.js) — this guard keeps `php artisan migrate` idempotent
        // on the shared remote database and only builds the table on a
        // genuinely fresh one.
        if (Schema::hasTable('kostos_rooms')) {
            return;
        }

        Schema::create('kostos_rooms', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->unsignedInteger('seq')->autoIncrement();
            $table->unique('seq');
            $table->string('number', 32);
            $table->string('status', 16);
            $table->string('type', 16);
            $table->integer('price')->default(0);
            $table->integer('floor')->default(1);
            $table->string('size', 32)->default('');
            $table->json('facilities')->nullable();
            $table->string('tenantId', 64)->nullable();
            $table->text('notes')->nullable();
            $table->string('lastMaintenanceDate', 32)->nullable();
        });
    }

    public function down(): void
    {
        // No-op: this migration never truly "owns" table creation on the
        // shared remote DB (up() already skips creation when the table
        // pre-exists), so rollback must never drop the real kostos_rooms
        // table and its live data.
    }
};
