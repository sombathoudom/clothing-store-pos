<?php

namespace App\Models;

use Database\Factories\ReturnItemAllocationFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'return_item_id',
    'sale_item_allocation_id',
    'purchase_item_id',
    'qty',
])]
class ReturnItemAllocation extends Model
{
    /** @use HasFactory<ReturnItemAllocationFactory> */
    use HasFactory;

    public function returnItem(): BelongsTo
    {
        return $this->belongsTo(ReturnItem::class);
    }

    public function saleItemAllocation(): BelongsTo
    {
        return $this->belongsTo(SaleItemAllocation::class);
    }

    public function purchaseItem(): BelongsTo
    {
        return $this->belongsTo(PurchaseItem::class);
    }
}
