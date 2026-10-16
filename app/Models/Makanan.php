<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Makanan extends Model
{
    protected $table = 'makanan';

    protected $primaryKey = 'content_id';

    public $incrementing = false;

    protected $fillable = [
        'content_id',
        'ingredients',
        'recipe',
        'serving_method',
    ];

    public function culturalContent(): BelongsTo
    {
        return $this->belongsTo(CulturalContent::class, 'content_id');
    }
}
