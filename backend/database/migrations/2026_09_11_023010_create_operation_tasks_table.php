<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('operation_tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('kostos_users')->onDelete('cascade');
            $table->string('property_id')->index();
            $table->string('custom_id');
            $table->unique(['user_id', 'custom_id']);
            $table->string('type');
            $table->string('title');
            $table->string('room_number');
            $table->string('priority');
            $table->string('status');
            $table->string('assigned_to');
            $table->decimal('estimated_cost', 15, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('operation_tasks'); }
};
