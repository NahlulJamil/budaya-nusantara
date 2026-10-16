<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BajuAdatVariant extends Model
{
    protected $table = 'baju_adat_variants';

    protected $fillable = [
        'content_id',
        'gender',
        'avatar_image',
        'description',
    ];

    public function bajuAdat(): BelongsTo
    {
        return $this->belongsTo(BajuAdat::class, 'content_id', 'content_id');
    }
}
