<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('staff_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('kostos_users')->onDelete('cascade');
            $table->string('property_id')->nullable()->index();
            $table->string('custom_id');
            $table->unique(['user_id', 'custom_id']);
            $table->string('name');
            $table->string('role');
            $table->string('phone');
            $table->string('email');
            $table->string('status');
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('staff_members'); }
};
