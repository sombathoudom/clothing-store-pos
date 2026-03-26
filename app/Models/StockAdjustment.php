<?php

namespace App\Models;

use App\Enums\StockAdjustmentReason;
use App\Enums\StockAdjustmentType;
use Database\Factories\StockAdjustmentFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'product_variant_id',
    'type',
    'reason',
    'qty',
    'note',
    'performed_at',
])]
class StockAdjustment extends Model
{
    /** @use HasFactory<StockAdjustmentFactory> */
    use HasFactory;

    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }

    public function allocations(): HasMany
    {
        return $this->hasMany(AdjustmentAllocation::class);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => StockAdjustmentType::class,
            'reason' => StockAdjustmentReason::class,
            'performed_at' => 'datetime',
        ];
    }
}
