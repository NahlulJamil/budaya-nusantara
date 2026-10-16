<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Tradisi extends Model
{
    protected $table = 'tradisi';

    protected $primaryKey = 'content_id';

    public $incrementing = false;

    protected $fillable = [
        'content_id',
        'jenis_tradisi_id',
        'process',
        'values',
        'implementation_time',
    ];

    public function culturalContent(): BelongsTo
    {
        return $this->belongsTo(CulturalContent::class, 'content_id');
    }

    public function jenisTradisi(): BelongsTo
    {
        return $this->belongsTo(JenisTradisi::class, 'jenis_tradisi_id');
    }
}
