<?php

namespace App\Models;

use Database\Factories\ExchangeItemFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'exchange_record_id',
    'sale_item_id',
    'replacement_product_variant_id',
    'qty',
    'old_unit_price',
    'new_unit_price',
    'difference_total',
])]
class ExchangeItem extends Model
{
    /** @use HasFactory<ExchangeItemFactory> */
    use HasFactory;

    public function exchangeRecord(): BelongsTo
    {
        return $this->belongsTo(ExchangeRecord::class);
    }

    public function saleItem(): BelongsTo
    {
        return $this->belongsTo(SaleItem::class);
    }

    public function replacementProductVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'replacement_product_variant_id');
    }

    public function allocations(): HasMany
    {
        return $this->hasMany(ExchangeItemAllocation::class);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'old_unit_price' => 'decimal:4',
            'new_unit_price' => 'decimal:4',
            'difference_total' => 'decimal:2',
        ];
    }
}
