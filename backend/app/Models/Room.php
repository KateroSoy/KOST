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
        'id', 'user_id', 'propertyId', 'number', 'status', 'housekeepingStatus', 'type',
        'price', 'pricePerDay', 'pricePerMonth', 'pricePerWeek',
        'rentalTypesAllowed', 'floor', 'size', 'maxGuests',
        'facilities', 'images', 'description',
        'tenantId', 'notes', 'lastMaintenanceDate',
    ];

    protected $casts = [
        'facilities'         => 'array',
        'rentalTypesAllowed' => 'array',
        'images'             => 'array',
        'price'              => 'integer',
        'pricePerDay'        => 'integer',
        'pricePerMonth'      => 'integer',
        'pricePerWeek'       => 'integer',
        'floor'              => 'integer',
        'maxGuests'          => 'integer',
    ];
}
