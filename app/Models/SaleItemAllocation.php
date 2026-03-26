<?php

namespace App\Models;

use Database\Factories\SaleItemAllocationFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'sale_item_id',
    'purchase_item_id',
    'qty',
    'unit_cost',
    'total_cost',
])]
class SaleItemAllocation extends Model
{
    /** @use HasFactory<SaleItemAllocationFactory> */
    use HasFactory;

    public function saleItem(): BelongsTo
    {
        return $this->belongsTo(SaleItem::class);
    }

    public function purchaseItem(): BelongsTo
    {
        return $this->belongsTo(PurchaseItem::class);
    }

    public function returnAllocations(): HasMany
    {
        return $this->hasMany(ReturnItemAllocation::class);
    }

    public function exchangeItemAllocations(): HasMany
    {
        return $this->hasMany(ExchangeItemAllocation::class);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'unit_cost' => 'decimal:4',
            'total_cost' => 'decimal:2',
        ];
    }
}
