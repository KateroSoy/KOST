<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WebsiteConfig extends Model {
    use HasFactory;
    protected $guarded = ['id'];
    protected $casts = [
        'show_availability_widget' => 'boolean',
        'show_reviews' => 'boolean',
        'show_faq' => 'boolean',
        'is_published' => 'boolean',
        'sections' => 'array',
    ];
}
