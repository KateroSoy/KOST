<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Non-destructive migration: adds all fields needed for StayFlow dual-stay
 * (Harian / Bulanan) functionality to the existing kostos_* tables.
 *
 * Uses ->after() for readability on MySQL; safe to run multiple times because
 * every block checks hasColumn() first.
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── kostos_rooms ─────────────────────────────────────────────────────
        Schema::table('kostos_rooms', function (Blueprint $table) {
            if (! Schema::hasColumn('kostos_rooms', 'housekeepingStatus')) {
                $table->string('housekeepingStatus', 32)->default('Bersih')->after('status');
            }
            if (! Schema::hasColumn('kostos_rooms', 'pricePerDay')) {
                $table->unsignedInteger('pricePerDay')->default(0)->after('price');
            }
            if (! Schema::hasColumn('kostos_rooms', 'pricePerMonth')) {
                $table->unsignedInteger('pricePerMonth')->default(0)->after('pricePerDay');
            }
            if (! Schema::hasColumn('kostos_rooms', 'pricePerWeek')) {
                $table->unsignedInteger('pricePerWeek')->default(0)->after('pricePerMonth');
            }
            if (! Schema::hasColumn('kostos_rooms', 'rentalTypesAllowed')) {
                $table->json('rentalTypesAllowed')->nullable()->after('pricePerWeek');
            }
            if (! Schema::hasColumn('kostos_rooms', 'maxGuests')) {
                $table->unsignedTinyInteger('maxGuests')->default(2)->after('rentalTypesAllowed');
            }
            if (! Schema::hasColumn('kostos_rooms', 'images')) {
                $table->json('images')->nullable()->after('facilities');
            }
            if (! Schema::hasColumn('kostos_rooms', 'description')) {
                $table->text('description')->nullable()->after('images');
            }
        });

        // ── kostos_tenants ────────────────────────────────────────────────────
        Schema::table('kostos_tenants', function (Blueprint $table) {
            if (! Schema::hasColumn('kostos_tenants', 'guestType')) {
                $table->string('guestType', 16)->default('Bulanan')->after('email');
            }
            if (! Schema::hasColumn('kostos_tenants', 'checkInDate')) {
                $table->string('checkInDate', 32)->nullable()->after('guestType');
            }
            if (! Schema::hasColumn('kostos_tenants', 'checkOutDate')) {
                $table->string('checkOutDate', 32)->nullable()->after('checkInDate');
            }
            if (! Schema::hasColumn('kostos_tenants', 'idType')) {
                $table->string('idType', 16)->default('KTP')->after('checkOutDate');
            }
            if (! Schema::hasColumn('kostos_tenants', 'vehicleNumber')) {
                $table->string('vehicleNumber', 32)->nullable()->after('idType');
            }
            if (! Schema::hasColumn('kostos_tenants', 'totalGuests')) {
                $table->unsignedTinyInteger('totalGuests')->default(1)->after('vehicleNumber');
            }
            if (! Schema::hasColumn('kostos_tenants', 'bookingOrigin')) {
                $table->string('bookingOrigin', 32)->default('Walk-in')->after('totalGuests');
            }
        });

        // ── kostos_bills ──────────────────────────────────────────────────────
        Schema::table('kostos_bills', function (Blueprint $table) {
            if (! Schema::hasColumn('kostos_bills', 'rentalType')) {
                $table->string('rentalType', 16)->default('Bulanan')->after('roomNumber');
            }
            if (! Schema::hasColumn('kostos_bills', 'stayDuration')) {
                $table->unsignedInteger('stayDuration')->default(1)->after('rentalType');
            }
            if (! Schema::hasColumn('kostos_bills', 'checkInDate')) {
                $table->string('checkInDate', 32)->nullable()->after('stayDuration');
            }
            if (! Schema::hasColumn('kostos_bills', 'checkOutDate')) {
                $table->string('checkOutDate', 32)->nullable()->after('checkInDate');
            }
        });
    }

    public function down(): void
    {
        // Never drop columns — this migration only adds; rollback is no-op
        // to protect production data on the shared Hostinger database.
    }
};
