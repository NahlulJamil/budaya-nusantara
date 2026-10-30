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

    /**
     * Varian ejaan nama provinsi pada data daerah (mis. "Sumatera" vs "Sumatra").
     *
     * @return array<int, string>
     */
    public static function provinsiVariants(string $provinsi): array
    {
        return array_values(array_unique([
            $provinsi,
            str_replace('Sumatera', 'Sumatra', $provinsi),
            str_replace('Sumatra', 'Sumatera', $provinsi),
        ]));
    }

    public function culturalContents(): HasMany
    {
        return $this->hasMany(CulturalContent::class, 'daerah_id');
    }

    public function aksaras(): HasMany
    {
        return $this->hasMany(Aksara::class, 'daerah_id');
    }
}
