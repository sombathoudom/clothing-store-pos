<?php

namespace App\Models;

use Database\Factories\ReturnRecordFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['sale_id', 'reference_no', 'refund_total', 'note', 'returned_at'])]
class ReturnRecord extends Model
{
    /** @use HasFactory<ReturnRecordFactory> */
    use HasFactory;

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(ReturnItem::class);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'refund_total' => 'decimal:2',
            'returned_at' => 'datetime',
        ];
    }
}
