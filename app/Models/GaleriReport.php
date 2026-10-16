<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GaleriReport extends Model
{
    protected $table = 'galeri_reports';

    protected $fillable = [
        'gallery_post_id',
        'user_id',
        'reason',
        'description',
        'status',
    ];

    public function post(): BelongsTo
    {
        return $this->belongsTo(GaleriPost::class, 'gallery_post_id');
    }

    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
