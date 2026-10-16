<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InteractiveAsset extends Model
{
    protected $table = 'interactive_assets';

    protected $fillable = [
        'name',
        'asset_type',
        'asset_path',
        'configuration',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'configuration' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function alatMusiks(): HasMany
    {
        return $this->hasMany(AlatMusik::class, 'interactive_asset_id');
    }
}
