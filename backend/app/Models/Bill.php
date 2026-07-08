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
        'id', 'tenantId', 'tenantName', 'roomId', 'roomNumber', 'period',
        'dueDate', 'rentAmount', 'electricityCharge', 'waterCharge',
        'additionalFee', 'discount', 'lateFee', 'totalAmount', 'paidAmount',
        'status', 'paymentMethod', 'paymentDate', 'notes',
    ];
}
