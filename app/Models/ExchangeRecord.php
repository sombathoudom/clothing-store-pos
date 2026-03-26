<?php

namespace App\Models;

use Database\Factories\ExchangeRecordFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['sale_id', 'reference_no', 'difference_total', 'note', 'exchanged_at'])]
class ExchangeRecord extends Model
{
    /** @use HasFactory<ExchangeRecordFactory> */
    use HasFactory;

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(ExchangeItem::class);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'difference_total' => 'decimal:2',
            'exchanged_at' => 'datetime',
        ];
    }
}
