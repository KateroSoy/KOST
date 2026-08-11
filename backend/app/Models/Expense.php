<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    protected $table = 'kostos_expenses';

    protected $primaryKey = 'id';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $fillable = ['id', 'seq', 'user_id', 'category', 'description', 'date', 'amount', 'notes'];

    protected $casts = [
        'amount' => 'integer',
    ];
}
