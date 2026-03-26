<?php

namespace App\Support;

use App\Models\PurchaseItem;
use App\Models\ReturnRecord;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ReturnService
{
    public function __construct(private ReturnReferenceGenerator $referenceGenerator) {}

    /**
     * @param  array{
     *     note?: string|null,
     *     returned_at:string,
     *     items: array<int, array{sale_item_id:int, qty:int}>
     * }  $payload
     */
    public function create(Sale $sale, array $payload): ReturnRecord
    {
        return DB::transaction(function () use ($sale, $payload): ReturnRecord {
            $return = ReturnRecord::create([
                'sale_id' => $sale->id,
                'reference_no' => $this->referenceGenerator->next(),
                'refund_total' => 0,
                'note' => $payload['note'] ?? null,
                'returned_at' => $payload['returned_at'],
            ]);

            $refundTotal = 0.0;

            foreach ($payload['items'] as $item) {
                $refundTotal += $this->createReturnItem($return, $sale, $item);
            }

            $return->update([
                'refund_total' => round($refundTotal, 2),
            ]);

            return $return->fresh(['items.allocations.purchaseItem', 'sale']);
        });
    }

    /**
     * @param  array{sale_item_id:int, qty:int}  $item
     */
    private function createReturnItem(ReturnRecord $return, Sale $sale, array $item): float
    {
        /** @var SaleItem $saleItem */
        $saleItem = $sale->items()
            ->with([
                'allocations.purchaseItem',
                'returnItems.allocations',
            ])
            ->findOrFail($item['sale_item_id']);

        $alreadyReturned = (int) $saleItem->returnItems->sum('qty');
        $availableToReturn = $saleItem->qty - $alreadyReturned;

        if ($item['qty'] > $availableToReturn) {
            throw ValidationException::withMessages([
                'items' => ['You cannot return more than the remaining sold quantity.'],
            ]);
        }

        $unitSellPrice = round((float) $saleItem->subtotal / max($saleItem->qty, 1), 2);
        $refundTotal = round($unitSellPrice * $item['qty'], 2);

        $returnItem = $return->items()->create([
            'sale_item_id' => $saleItem->id,
            'qty' => $item['qty'],
            'refund_total' => $refundTotal,
        ]);

        $remainingToRestore = (int) $item['qty'];

        foreach ($saleItem->allocations as $allocation) {
            if ($remainingToRestore === 0) {
                break;
            }

            $alreadyRestoredForAllocation = (int) $allocation->returnAllocations()->sum('qty');
            $availableForAllocation = $allocation->qty - $alreadyRestoredForAllocation;

            if ($availableForAllocation <= 0) {
                continue;
            }

            $restoreQuantity = min($remainingToRestore, $availableForAllocation);

            $returnItem->allocations()->create([
                'sale_item_allocation_id' => $allocation->id,
                'purchase_item_id' => $allocation->purchase_item_id,
                'qty' => $restoreQuantity,
            ]);

            /** @var PurchaseItem $purchaseItem */
            $purchaseItem = $allocation->purchaseItem;
            $purchaseItem->increment('remaining_qty', $restoreQuantity);

            $remainingToRestore -= $restoreQuantity;
        }

        return $refundTotal;
    }
}
