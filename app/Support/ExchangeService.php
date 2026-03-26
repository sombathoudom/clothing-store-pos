<?php

namespace App\Support;

use App\Models\ExchangeRecord;
use App\Models\PurchaseItem;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ExchangeService
{
    public function __construct(private ExchangeReferenceGenerator $referenceGenerator) {}

    /**
     * @param  array{
     *     note?: string|null,
     *     exchanged_at:string,
     *     items: array<int, array{sale_item_id:int, replacement_product_variant_id:int, qty:int, new_unit_price:int|float|string}>
     * }  $payload
     */
    public function create(Sale $sale, array $payload): ExchangeRecord
    {
        return DB::transaction(function () use ($sale, $payload): ExchangeRecord {
            $exchange = ExchangeRecord::create([
                'sale_id' => $sale->id,
                'reference_no' => $this->referenceGenerator->next(),
                'difference_total' => 0,
                'note' => $payload['note'] ?? null,
                'exchanged_at' => $payload['exchanged_at'],
            ]);

            $differenceTotal = 0.0;

            foreach ($payload['items'] as $item) {
                $differenceTotal += $this->createExchangeItem($exchange, $sale, $item);
            }

            $exchange->update([
                'difference_total' => round($differenceTotal, 2),
            ]);

            return $exchange->fresh(['items.allocations.purchaseItem', 'sale']);
        });
    }

    /**
     * @param  array{sale_item_id:int, replacement_product_variant_id:int, qty:int, new_unit_price:int|float|string}  $item
     */
    private function createExchangeItem(ExchangeRecord $exchange, Sale $sale, array $item): float
    {
        /** @var SaleItem $saleItem */
        $saleItem = $sale->items()
            ->with([
                'allocations.purchaseItem',
                'returnItems.allocations',
                'exchangeItems',
            ])
            ->findOrFail($item['sale_item_id']);

        $alreadyReturned = (int) $saleItem->returnItems->sum('qty');
        $alreadyExchanged = (int) $saleItem->exchangeItems->sum('qty');
        $availableToExchange = $saleItem->qty - $alreadyReturned - $alreadyExchanged;

        if ($item['qty'] > $availableToExchange) {
            throw ValidationException::withMessages([
                'items' => ['You cannot exchange more than the remaining sold quantity.'],
            ]);
        }

        $replacementBatches = PurchaseItem::query()
            ->where('product_variant_id', $item['replacement_product_variant_id'])
            ->where('remaining_qty', '>', 0)
            ->join('purchases', 'purchases.id', '=', 'purchase_items.purchase_id')
            ->select('purchase_items.*')
            ->orderBy('purchases.purchased_at')
            ->orderBy('purchase_items.id')
            ->lockForUpdate()
            ->get();

        if ((int) $replacementBatches->sum('remaining_qty') < $item['qty']) {
            throw ValidationException::withMessages([
                'items' => ['Not enough stock is available for the replacement variant.'],
            ]);
        }

        $oldUnitPrice = round((float) $saleItem->subtotal / max($saleItem->qty, 1), 4);
        $newUnitPrice = (float) $item['new_unit_price'];
        $differenceTotal = round(($newUnitPrice - $oldUnitPrice) * $item['qty'], 2);

        $exchangeItem = $exchange->items()->create([
            'sale_item_id' => $saleItem->id,
            'replacement_product_variant_id' => $item['replacement_product_variant_id'],
            'qty' => $item['qty'],
            'old_unit_price' => $oldUnitPrice,
            'new_unit_price' => $newUnitPrice,
            'difference_total' => $differenceTotal,
        ]);

        $remainingToRestore = (int) $item['qty'];

        foreach ($saleItem->allocations as $allocation) {
            if ($remainingToRestore === 0) {
                break;
            }

            $alreadyRestored = (int) $allocation->returnAllocations()->sum('qty')
                + (int) $allocation->exchangeItemAllocations()
                    ->where('allocation_role', 'restored')
                    ->sum('qty');
            $availableForRestore = $allocation->qty - $alreadyRestored;

            if ($availableForRestore <= 0) {
                continue;
            }

            $restoreQuantity = min($remainingToRestore, $availableForRestore);
            $unitCost = (float) $allocation->unit_cost;

            $exchangeItem->allocations()->create([
                'sale_item_allocation_id' => $allocation->id,
                'purchase_item_id' => $allocation->purchase_item_id,
                'allocation_role' => 'restored',
                'qty' => $restoreQuantity,
                'unit_cost' => $unitCost,
                'total_cost' => round($restoreQuantity * $unitCost, 2),
            ]);

            $allocation->purchaseItem->increment('remaining_qty', $restoreQuantity);
            $remainingToRestore -= $restoreQuantity;
        }

        $remainingToAllocate = (int) $item['qty'];

        foreach ($replacementBatches as $batch) {
            if ($remainingToAllocate === 0) {
                break;
            }

            $allocatedQuantity = min($remainingToAllocate, $batch->remaining_qty);
            $unitCost = (float) $batch->cost_price;

            $exchangeItem->allocations()->create([
                'sale_item_allocation_id' => null,
                'purchase_item_id' => $batch->id,
                'allocation_role' => 'issued',
                'qty' => $allocatedQuantity,
                'unit_cost' => $unitCost,
                'total_cost' => round($allocatedQuantity * $unitCost, 2),
            ]);

            $batch->decrement('remaining_qty', $allocatedQuantity);
            $remainingToAllocate -= $allocatedQuantity;
        }

        return $differenceTotal;
    }
}
