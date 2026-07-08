<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // kostos_bills already exists (created by the Express backend, see
        // server/db.js) — guard keeps this idempotent on the shared DB.
        if (Schema::hasTable('kostos_bills')) {
            return;
        }

        Schema::create('kostos_bills', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->unsignedInteger('seq')->autoIncrement();
            $table->unique('seq');
            $table->string('tenantId', 64);
            $table->string('tenantName', 191)->default('');
            $table->string('roomId', 64)->default('');
            $table->string('roomNumber', 32)->default('');
            $table->string('period', 32)->default('');
            $table->string('dueDate', 32)->default('');
            $table->integer('rentAmount')->default(0);
            $table->integer('electricityCharge')->default(0);
            $table->integer('waterCharge')->default(0);
            $table->integer('additionalFee')->default(0);
            $table->integer('discount')->default(0);
            $table->integer('lateFee')->default(0);
            $table->integer('totalAmount')->default(0);
            $table->integer('paidAmount')->default(0);
            $table->string('status', 16);
            $table->string('paymentMethod', 64)->nullable();
            $table->string('paymentDate', 32)->nullable();
            $table->text('notes')->nullable();
        });
    }

    public function down(): void
    {
        // No-op: this migration never truly "owns" table creation on the
        // shared remote DB (up() already skips creation when the table
        // pre-exists), so rollback must never drop the real kostos_bills
        // table and its live data.
    }
};
