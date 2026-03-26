<?php

namespace App\Models;

use Database\Factories\ExchangeItemAllocationFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'exchange_item_id',
    'sale_item_allocation_id',
    'purchase_item_id',
    'allocation_role',
    'qty',
    'unit_cost',
    'total_cost',
])]
class ExchangeItemAllocation extends Model
{
    /** @use HasFactory<ExchangeItemAllocationFactory> */
    use HasFactory;

    public function exchangeItem(): BelongsTo
    {
        return $this->belongsTo(ExchangeItem::class);
    }

    public function purchaseItem(): BelongsTo
    {
        return $this->belongsTo(PurchaseItem::class);
    }

    public function saleItemAllocation(): BelongsTo
    {
        return $this->belongsTo(SaleItemAllocation::class);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'allocation_role' => 'string',
            'unit_cost' => 'decimal:4',
            'total_cost' => 'decimal:2',
        ];
    }
}
