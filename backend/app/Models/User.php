<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $table = 'kostos_users';

    protected $fillable = [
        'name',
        'phone',
        'slug',
        'role',
        'status',
        'plan',
        'expires_at',
        'email',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'password'   => 'hashed',
            'expires_at' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Check if user is Super Admin (SaaS Platform Owner)
     */
    public function isSuperAdmin(): bool
    {
        return $this->role === 'super_admin';
    }
}
