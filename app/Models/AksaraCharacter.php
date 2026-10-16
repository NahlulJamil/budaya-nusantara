<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AksaraCharacter extends Model
{
    protected $table = 'aksara_characters';

    protected $fillable = [
        'category_id',
        'character',
        'latin',
        'description',
        'image',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(AksaraCategory::class, 'category_id');
    }
}
