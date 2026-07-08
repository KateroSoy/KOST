<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $table = 'kostos_settings';

    protected $primaryKey = 'id';

    public $incrementing = false;

    protected $keyType = 'int';

    public $timestamps = false;

    protected $fillable = ['id', 'data'];

    protected $casts = [
        'data' => 'array',
    ];

    public static function defaultDueDateDay(): int
    {
        $settings = static::find(1);

        return (int) ($settings?->data['defaultDueDateDay'] ?? 5);
    }
}
