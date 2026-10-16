<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GaleriPost extends Model
{
    protected $table = 'galeri_posts';

    protected $fillable = [
        'user_id',
        'content_id',
        'title',
        'caption',
        'location',
        'activity_date',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'activity_date' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function culturalContent(): BelongsTo
    {
        return $this->belongsTo(CulturalContent::class, 'content_id');
    }

    public function media(): HasMany
    {
        return $this->hasMany(GaleriMedia::class, 'gallery_post_id');
    }

    public function reports(): HasMany
    {
        return $this->hasMany(GaleriReport::class, 'gallery_post_id');
    }
}
