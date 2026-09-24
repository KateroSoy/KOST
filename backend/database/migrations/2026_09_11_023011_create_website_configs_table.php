<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('website_configs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('kostos_users')->onDelete('cascade');
            $table->string('property_id');
            $table->unique(['user_id', 'property_id']);
            $table->string('template_id');
            $table->string('subdomain')->unique();
            $table->string('custom_domain')->nullable()->unique();
            $table->string('headline');
            $table->string('subheadline');
            $table->text('about_text');
            $table->string('accent_color');
            $table->boolean('show_availability_widget')->default(true);
            $table->boolean('show_reviews')->default(true);
            $table->boolean('show_faq')->default(true);
            $table->string('whatsapp_direct');
            $table->json('sections');
            $table->boolean('is_published')->default(true);
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('website_configs'); }
};
