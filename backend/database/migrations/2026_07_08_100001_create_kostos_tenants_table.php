<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // kostos_tenants already exists (created by the Express backend, see
        // server/db.js) — guard keeps this idempotent on the shared DB.
        if (Schema::hasTable('kostos_tenants')) {
            return;
        }

        Schema::create('kostos_tenants', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->unsignedInteger('seq')->autoIncrement();
            $table->unique('seq');
            $table->string('name', 191);
            $table->string('phone', 32)->default('');
            $table->string('email', 191)->default('');
            $table->json('emergencyContact')->nullable();
            $table->string('idNumber', 64)->default('');
            $table->string('roomAssigned', 64)->default('');
            $table->string('moveInDate', 32)->default('');
            $table->integer('rentAmount')->default(0);
            $table->integer('deposit')->default(0);
            $table->string('status', 16);
            $table->text('notes')->nullable();
            $table->text('idPhotoUrl')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kostos_tenants');
    }
};
