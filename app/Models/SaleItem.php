<?php

namespace App\Models;

use Database\Factories\SaleItemFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'sale_id',
    'product_variant_id',
    'qty',
    'sell_price',
    'subtotal',
    'cost_total',
    'profit_total',
])]
class SaleItem extends Model
{
    /** @use HasFactory<SaleItemFactory> */
    use HasFactory;

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }

    public function allocations(): HasMany
    {
        return $this->hasMany(SaleItemAllocation::class);
    }

    public function returnItems(): HasMany
    {
        return $this->hasMany(ReturnItem::class);
    }

    public function exchangeItems(): HasMany
    {
        return $this->hasMany(ExchangeItem::class);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'sell_price' => 'decimal:4',
            'subtotal' => 'decimal:2',
            'cost_total' => 'decimal:2',
            'profit_total' => 'decimal:2',
        ];
    }
}
