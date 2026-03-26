<?php

namespace App\Support;

use App\Enums\SaleStatus;
use App\Enums\SettingKey;
use App\Models\PurchaseItem;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SaleCheckoutService
{
    public function __construct(
        private BusinessSettings $businessSettings,
        private InvoiceNumberGenerator $invoiceNumberGenerator,
    ) {}

    /**
     * @param  array{
     *     customer_name?: string|null,
     *     customer_phone?: string|null,
     *     customer_address?: string|null,
     *     discount?: int|float|string|null,
     *     items: array<int, array{product_variant_id:int, qty:int, sell_price:int|float|string}>
     * }  $payload
     */
    public function checkout(array $payload): Sale
    {
        return DB::transaction(function () use ($payload): Sale {
            $discount = round((float) ($payload['discount'] ?? 0), 2);
            $exchangeRate = (float) $this->businessSettings->get(SettingKey::RielExchangeRate);
            $invoiceNumber = $this->invoiceNumberGenerator->next();

            $sale = Sale::create([
                'invoice_no' => $invoiceNumber,
                'customer_name' => $payload['customer_name'] ?? null,
                'customer_phone' => $payload['customer_phone'] ?? null,
                'customer_address' => $payload['customer_address'] ?? null,
                'status' => SaleStatus::Pending,
                'total_amount' => 0,
                'discount' => $discount,
                'final_amount' => 0,
                'riel_exchange_rate' => $exchangeRate,
                'sold_at' => now(),
            ]);

            $totalAmount = 0.0;

            foreach ($payload['items'] as $item) {
                $saleItem = $this->createSaleItem($sale, $item);
                $totalAmount += (float) $saleItem->subtotal;
            }

            $sale->update([
                'total_amount' => round($totalAmount, 2),
                'final_amount' => round(max($totalAmount - $discount, 0), 2),
            ]);

            return $sale->fresh(['items.allocations.purchaseItem.purchase', 'items.productVariant.product.category']);
        });
    }

    /**
     * @param  array{product_variant_id:int, qty:int, sell_price:int|float|string}  $item
     */
    private function createSaleItem(Sale $sale, array $item): SaleItem
    {
        $requiredQuantity = (int) $item['qty'];
        $sellPrice = (float) $item['sell_price'];

        $batches = PurchaseItem::query()
            ->where('product_variant_id', $item['product_variant_id'])
            ->where('remaining_qty', '>', 0)
            ->join('purchases', 'purchases.id', '=', 'purchase_items.purchase_id')
            ->select('purchase_items.*')
            ->orderBy('purchases.purchased_at')
            ->orderBy('purchase_items.id')
            ->lockForUpdate()
            ->get();

        if ((int) $batches->sum('remaining_qty') < $requiredQuantity) {
            throw ValidationException::withMessages([
                'items' => ['Not enough stock is available for one or more selected variants.'],
            ]);
        }

        $saleItem = $sale->items()->create([
            'product_variant_id' => $item['product_variant_id'],
            'qty' => $requiredQuantity,
            'sell_price' => $sellPrice,
            'subtotal' => round($requiredQuantity * $sellPrice, 2),
            'cost_total' => 0,
            'profit_total' => 0,
        ]);

        $remainingToAllocate = $requiredQuantity;
        $costTotal = 0.0;

        foreach ($batches as $batch) {
            if ($remainingToAllocate === 0) {
                break;
            }

            $allocatedQuantity = min($remainingToAllocate, $batch->remaining_qty);
            $unitCost = (float) $batch->cost_price;
            $allocationCost = round($allocatedQuantity * $unitCost, 2);

            $saleItem->allocations()->create([
                'purchase_item_id' => $batch->id,
                'qty' => $allocatedQuantity,
                'unit_cost' => $unitCost,
                'total_cost' => $allocationCost,
            ]);

            $batch->decrement('remaining_qty', $allocatedQuantity);

            $remainingToAllocate -= $allocatedQuantity;
            $costTotal += $allocationCost;
        }

        $saleItem->update([
            'cost_total' => round($costTotal, 2),
            'profit_total' => round((float) $saleItem->subtotal - $costTotal, 2),
        ]);

        return $saleItem->fresh('allocations');
    }
}
