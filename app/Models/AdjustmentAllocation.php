<?php

namespace App\Models;

use Database\Factories\AdjustmentAllocationFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'stock_adjustment_id',
    'purchase_item_id',
    'qty',
])]
class AdjustmentAllocation extends Model
{
    /** @use HasFactory<AdjustmentAllocationFactory> */
    use HasFactory;

    public function stockAdjustment(): BelongsTo
    {
        return $this->belongsTo(StockAdjustment::class);
    }

    public function purchaseItem(): BelongsTo
    {
        return $this->belongsTo(PurchaseItem::class);
    }
}
