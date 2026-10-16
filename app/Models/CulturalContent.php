<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class CulturalContent extends Model
{
    protected $table = 'cultural_contents';

    protected $fillable = [
        'daerah_id',
        'category',
        'title',
        'description',
        'history',
        'meaning',
        'main_image',
        'status',
        'created_by',
    ];

    public function daerah(): BelongsTo
    {
        return $this->belongsTo(Daerah::class, 'daerah_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function tradisi(): HasOne
    {
        return $this->hasOne(Tradisi::class, 'content_id');
    }

    public function bajuAdat(): HasOne
    {
        return $this->hasOne(BajuAdat::class, 'content_id');
    }

    public function makanan(): HasOne
    {
        return $this->hasOne(Makanan::class, 'content_id');
    }

    public function alatMusik(): HasOne
    {
        return $this->hasOne(AlatMusik::class, 'content_id');
    }

    public function contentSources(): HasMany
    {
        return $this->hasMany(ContentSource::class, 'content_id');
    }

    public function galeriPosts(): HasMany
    {
        return $this->hasMany(GaleriPost::class, 'content_id');
    }

    public function chatSessions(): HasMany
    {
        return $this->hasMany(ChatSession::class, 'current_content_id');
    }
}
