<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // kostos_complaints already exists (created by the Express backend,
        // see server/db.js) — guard keeps this idempotent on the shared DB.
        if (Schema::hasTable('kostos_complaints')) {
            return;
        }

        Schema::create('kostos_complaints', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->unsignedInteger('seq')->autoIncrement();
            $table->unique('seq');
            $table->string('tenantId', 64)->default('');
            $table->string('tenantName', 191)->default('');
            $table->string('roomId', 64)->default('');
            $table->string('roomNumber', 32)->default('');
            $table->text('title');
            $table->string('category', 32);
            $table->string('status', 16);
            $table->string('priority', 16);
            $table->string('date', 32)->default('');
            $table->text('description');
            $table->integer('repairCost')->nullable();
            $table->text('notes')->nullable();
        });
    }

    public function down(): void
    {
        // No-op: this migration never truly "owns" table creation on the
        // shared remote DB (up() already skips creation when the table
        // pre-exists), so rollback must never drop the real kostos_complaints
        // table and its live data.
    }
};
