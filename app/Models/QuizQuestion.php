<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QuizQuestion extends Model
{
    protected $table = 'quiz_questions';

    protected $fillable = [
        'aksara_id',
        'question',
        'displayed_character',
        'correct_answer',
        'explanation',
        'generated_by',
    ];

    public function aksara(): BelongsTo
    {
        return $this->belongsTo(Aksara::class, 'aksara_id');
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(QuizAttempt::class, 'question_id');
    }
}
