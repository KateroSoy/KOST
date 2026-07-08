<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Room extends Model
{
    protected $table = 'kostos_rooms';

    protected $primaryKey = 'id';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $fillable = [
        'id', 'number', 'status', 'type', 'price', 'floor', 'size',
        'facilities', 'tenantId', 'notes', 'lastMaintenanceDate',
    ];

    protected $casts = [
        'facilities' => 'array',
    ];
}
