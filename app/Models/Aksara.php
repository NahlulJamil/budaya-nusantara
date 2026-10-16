<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Aksara extends Model
{
    protected $table = 'aksara';

    protected $fillable = [
        'daerah_id',
        'name',
        'description',
        'history',
        'main_image',
    ];

    public function daerah(): BelongsTo
    {
        return $this->belongsTo(Daerah::class, 'daerah_id');
    }

    public function categories(): HasMany
    {
        return $this->hasMany(AksaraCategory::class, 'aksara_id');
    }

    public function quizQuestions(): HasMany
    {
        return $this->hasMany(QuizQuestion::class, 'aksara_id');
    }
}
