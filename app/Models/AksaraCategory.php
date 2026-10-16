<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AksaraCategory extends Model
{
    protected $table = 'aksara_categories';

    protected $fillable = [
        'aksara_id',
        'name',
        'description',
        'sort_order',
    ];

    public function aksara(): BelongsTo
    {
        return $this->belongsTo(Aksara::class, 'aksara_id');
    }

    public function characters(): HasMany
    {
        return $this->hasMany(AksaraCharacter::class, 'category_id');
    }
}
