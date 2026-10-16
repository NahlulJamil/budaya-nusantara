<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JenisTradisi extends Model
{
    protected $table = 'jenis_tradisi';

    protected $fillable = [
        'nama',
        'deskripsi',
    ];

    public function tradisis(): HasMany
    {
        return $this->hasMany(Tradisi::class, 'jenis_tradisi_id');
    }
}
