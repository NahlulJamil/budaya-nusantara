<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Daerah extends Model
{
    protected $table = 'daerah';

    protected $fillable = [
        'nama',
        'provinsi',
        'deskripsi',
    ];

    public function culturalContents(): HasMany
    {
        return $this->hasMany(CulturalContent::class, 'daerah_id');
    }

    public function aksaras(): HasMany
    {
        return $this->hasMany(Aksara::class, 'daerah_id');
    }
}
