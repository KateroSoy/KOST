<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $table = 'kostos_settings';

    protected $primaryKey = 'id';

    public $incrementing = true;

    protected $keyType = 'int';

    public $timestamps = false;

    protected $fillable = ['user_id', 'data'];

    protected $casts = [
        'data' => 'array',
    ];

    /**
     * Get the default due date day for a given user (or fallback to global row 1).
     */
    public static function defaultDueDateDay(?int $userId = null): int
    {
        if ($userId) {
            $settings = static::where('user_id', $userId)->first();
        } else {
            $settings = static::first();
        }

        return (int) ($settings?->data['defaultDueDateDay'] ?? 5);
    }

    /**
     * Get the full settings data for a given user.
     */
    public static function forUser(int $userId): ?array
    {
        return static::where('user_id', $userId)->first()?->data;
    }
}
