<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GaleriMedia extends Model
{
    protected $table = 'galeri_media';

    protected $fillable = [
        'gallery_post_id',
        'file_path',
        'media_type',
    ];

    public function post(): BelongsTo
    {
        return $this->belongsTo(GaleriPost::class, 'gallery_post_id');
    }
}
