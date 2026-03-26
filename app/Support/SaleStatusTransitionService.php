<?php

namespace App\Support;

use App\Enums\SaleStatus;
use App\Models\Sale;
use Illuminate\Validation\ValidationException;

class SaleStatusTransitionService
{
    /**
     * @var array<string, list<string>>
     */
    private array $allowedTransitions = [
        'pending' => ['shipping', 'cancelled'],
        'shipping' => ['delivered', 'cancelled'],
        'delivered' => ['completed'],
        'completed' => [],
        'cancelled' => [],
    ];

    public function transition(Sale $sale, SaleStatus $targetStatus): Sale
    {
        if (! in_array($targetStatus->value, $this->allowedTransitions[$sale->status->value], true)) {
            throw ValidationException::withMessages([
                'status' => ['This status transition is not allowed.'],
            ]);
        }

        $sale->update([
            'status' => $targetStatus,
        ]);

        return $sale->fresh(['items.allocations.purchaseItem.purchase', 'items.productVariant.product.category']);
    }

    /**
     * @return list<string>
     */
    public function availableTransitions(Sale $sale): array
    {
        return $this->allowedTransitions[$sale->status->value];
    }
}
