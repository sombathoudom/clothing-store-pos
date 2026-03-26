<?php

namespace App\Models;

use Database\Factories\ReturnItemFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['return_record_id', 'sale_item_id', 'qty', 'refund_total'])]
class ReturnItem extends Model
{
    /** @use HasFactory<ReturnItemFactory> */
    use HasFactory;

    public function returnRecord(): BelongsTo
    {
        return $this->belongsTo(ReturnRecord::class);
    }

    public function saleItem(): BelongsTo
    {
        return $this->belongsTo(SaleItem::class);
    }

    public function allocations(): HasMany
    {
        return $this->hasMany(ReturnItemAllocation::class);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'refund_total' => 'decimal:2',
        ];
    }
}
