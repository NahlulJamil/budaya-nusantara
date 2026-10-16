<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AlatMusik extends Model
{
    protected $table = 'alat_musik';

    protected $primaryKey = 'content_id';

    public $incrementing = false;

    protected $fillable = [
        'content_id',
        'material',
        'how_to_play',
        'function',
        'audio',
        'interactive_asset_id',
    ];

    public function culturalContent(): BelongsTo
    {
        return $this->belongsTo(CulturalContent::class, 'content_id');
    }

    public function interactiveAsset(): BelongsTo
    {
        return $this->belongsTo(InteractiveAsset::class, 'interactive_asset_id');
    }
}
