<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('kostos_users')->onDelete('cascade');
            $table->string('property_id')->index();
            $table->string('custom_id');
            $table->unique(['user_id', 'custom_id']);
            $table->string('room_id')->nullable();
            $table->string('room_type');
            $table->string('room_number')->nullable();
            $table->string('guest_name');
            $table->string('guest_phone');
            $table->string('guest_email')->nullable();
            $table->date('move_in_date');
            $table->date('move_out_date')->nullable();
            $table->integer('duration_months');
            $table->integer('guests_count');
            $table->decimal('total_amount', 15, 2);
            $table->decimal('deposit_amount', 15, 2);
            $table->string('source');
            $table->string('status');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('bookings'); }
};
