<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContentSource extends Model
{
    protected $table = 'content_sources';

    protected $fillable = [
        'content_id',
        'title',
        'source_url',
        'author',
        'description',
    ];

    public function culturalContent(): BelongsTo
    {
        return $this->belongsTo(CulturalContent::class, 'content_id');
    }
}
