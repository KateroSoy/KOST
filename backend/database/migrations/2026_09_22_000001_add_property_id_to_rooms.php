<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (! Schema::hasColumn('kostos_rooms', 'propertyId')) {
            Schema::table('kostos_rooms', function (Blueprint $table) {
                $table->string('propertyId', 64)->nullable()->index();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('kostos_rooms', 'propertyId')) {
            Schema::table('kostos_rooms', fn (Blueprint $table) => $table->dropColumn('propertyId'));
        }
    }
};
