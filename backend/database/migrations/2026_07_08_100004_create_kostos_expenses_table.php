<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // kostos_expenses already exists (created by the Express backend,
        // see server/db.js) — guard keeps this idempotent on the shared DB.
        if (Schema::hasTable('kostos_expenses')) {
            return;
        }

        Schema::create('kostos_expenses', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->unsignedInteger('seq')->autoIncrement();
            $table->unique('seq');
            $table->string('category', 32);
            $table->text('description');
            $table->string('date', 32)->default('');
            $table->integer('amount')->default(0);
            $table->text('notes')->nullable();
        });
    }

    public function down(): void
    {
        // No-op: this migration never truly "owns" table creation on the
        // shared remote DB (up() already skips creation when the table
        // pre-exists), so rollback must never drop the real kostos_expenses
        // table and its live data.
    }
};
