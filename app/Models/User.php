<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['username', 'email', 'password'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function culturalContents(): HasMany
    {
        return $this->hasMany(CulturalContent::class, 'created_by');
    }

    public function quizAttempts(): HasMany
    {
        return $this->hasMany(QuizAttempt::class, 'user_id');
    }

    public function galeriPosts(): HasMany
    {
        return $this->hasMany(GaleriPost::class, 'user_id');
    }

    public function galeriReports(): HasMany
    {
        return $this->hasMany(GaleriReport::class, 'user_id');
    }

    public function chatSessions(): HasMany
    {
        return $this->hasMany(ChatSession::class, 'user_id');
    }
}
