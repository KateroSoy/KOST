<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Property extends Model
{
    protected $table = 'kostos_properties';

    protected $primaryKey = 'id';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $fillable = [
        'id', 'seq', 'user_id',
        'name', 'type', 'slug', 'address', 'city', 'description',
        'coverImage', 'images', 'facilities',
        'whatsapp', 'ownerName',
        'checkInTime', 'checkOutTime',
        'bankAccounts', 'qrisMerchantId',
        'startPriceDay', 'startPriceMonth',
    ];

    protected $casts = [
        'images'       => 'array',
        'facilities'   => 'array',
        'bankAccounts' => 'array',
        'startPriceDay'   => 'integer',
        'startPriceMonth' => 'integer',
    ];
}
