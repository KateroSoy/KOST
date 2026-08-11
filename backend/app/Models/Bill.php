<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Bill extends Model
{
    protected $table = 'kostos_bills';

    protected $primaryKey = 'id';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $fillable = [
        'id', 'user_id', 'tenantId', 'tenantName', 'roomId', 'roomNumber',
        'rentalType', 'stayDuration', 'checkInDate', 'checkOutDate',
        'period', 'dueDate',
        'rentAmount', 'electricityCharge', 'waterCharge',
        'additionalFee', 'discount', 'lateFee',
        'totalAmount', 'paidAmount', 'status',
        'paymentMethod', 'paymentDate', 'notes',
    ];

    protected $casts = [
        'rentAmount'       => 'integer',
        'electricityCharge'=> 'integer',
        'waterCharge'      => 'integer',
        'additionalFee'    => 'integer',
        'discount'         => 'integer',
        'lateFee'          => 'integer',
        'totalAmount'      => 'integer',
        'paidAmount'       => 'integer',
        'stayDuration'     => 'integer',
    ];
}
