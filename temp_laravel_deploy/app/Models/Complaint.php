<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Complaint extends Model
{
    protected $table = 'kostos_complaints';

    protected $primaryKey = 'id';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $fillable = [
        'id', 'tenantId', 'tenantName', 'roomId', 'roomNumber', 'title',
        'category', 'status', 'priority', 'date', 'description',
        'repairCost', 'notes',
    ];

    protected $casts = [
        'repairCost' => 'integer',
    ];
}

