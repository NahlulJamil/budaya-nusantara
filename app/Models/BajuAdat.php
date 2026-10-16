<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BajuAdat extends Model
{
    protected $table = 'baju_adat';

    protected $primaryKey = 'content_id';

    public $incrementing = false;

    protected $fillable = [
        'content_id',
        'usage',
    ];

    public function culturalContent(): BelongsTo
    {
        return $this->belongsTo(CulturalContent::class, 'content_id');
    }

    public function variants(): HasMany
    {
        return $this->hasMany(BajuAdatVariant::class, 'content_id', 'content_id');
    }
}
