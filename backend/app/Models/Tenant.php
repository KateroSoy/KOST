<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tenant extends Model
{
    protected $table = 'kostos_tenants';

    protected $primaryKey = 'id';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $fillable = [
        'id', 'user_id', 'name', 'phone', 'email',
        'guestType', 'checkInDate', 'checkOutDate',
        'idType', 'vehicleNumber', 'totalGuests', 'bookingOrigin',
        'emergencyContact', 'idNumber',
        'roomAssigned', 'moveInDate',
        'rentAmount', 'deposit', 'status',
        'notes', 'idPhotoUrl',
    ];

    protected $casts = [
        'emergencyContact' => 'array',
        'rentAmount'       => 'integer',
        'deposit'          => 'integer',
        'totalGuests'      => 'integer',
    ];
}
