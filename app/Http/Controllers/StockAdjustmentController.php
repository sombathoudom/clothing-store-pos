<?php

namespace App\Http\Controllers;

use App\Enums\StockAdjustmentReason;
use App\Enums\StockAdjustmentType;
use App\Http\Requests\StoreStockAdjustmentRequest;
use App\Models\ProductVariant;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\StockAdjustment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class StockAdjustmentController extends Controller
{
    public function index(): Response
    {
        $adjustments = StockAdjustment::query()
            ->with(['productVariant.product.category'])
            ->latest('performed_at')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (StockAdjustment $adjustment): array => [
                'id' => $adjustment->id,
                'product_name' => $adjustment->productVariant->product->name,
                'category_name' => $adjustment->productVariant->product->category->name,
                'size' => $adjustment->productVariant->size->value,
                'type' => $adjustment->type->value,
                'reason' => $adjustment->reason->value,
                'qty' => $adjustment->qty,
                'note' => $adjustment->note,
                'performed_at' => $adjustment->performed_at?->toDateTimeString(),
            ]);

        $variants = ProductVariant::query()
            ->select('product_variants.*')
            ->selectRaw('COALESCE(SUM(purchase_items.remaining_qty), 0) as current_stock')
            ->leftJoin('purchase_items', 'purchase_items.product_variant_id', '=', 'product_variants.id')
            ->join('products', 'products.id', '=', 'product_variants.product_id')
            ->join('categories', 'categories.id', '=', 'products.category_id')
            ->with(['product.category'])
            ->groupBy('product_variants.id', 'products.name', 'categories.name')
            ->orderBy('products.name')
            ->get()
            ->map(fn (ProductVariant $variant): array => [
                'id' => (string) $variant->id,
                'label' => sprintf('%s / %s', $variant->product->name, $variant->size->value),
                'category' => $variant->product->category->name,
                'current_stock' => (int) $variant->current_stock,
            ])
            ->all();

        return Inertia::render('adjustments/index', [
            'adjustments' => $adjustments,
            'variants' => $variants,
            'types' => StockAdjustmentType::values(),
            'reasons' => StockAdjustmentReason::values(),
        ]);
    }

    public function store(StoreStockAdjustmentRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request): void {
            $validated = $request->validated();

            $adjustment = StockAdjustment::create([
                'product_variant_id' => $validated['product_variant_id'],
                'type' => $validated['type'],
                'reason' => $validated['reason'],
                'qty' => $validated['qty'],
                'note' => $validated['note'] ?? null,
                'performed_at' => $validated['performed_at'],
            ]);

            if ($validated['type'] === StockAdjustmentType::Add->value) {
                $latestSellPrice = PurchaseItem::query()
                    ->where('product_variant_id', $validated['product_variant_id'])
                    ->whereNotNull('suggested_sell_price')
                    ->latest('id')
                    ->value('suggested_sell_price');

                $purchase = Purchase::create([
                    'reference_no' => null,
                    'supplier_name' => null,
                    'purchased_at' => $validated['performed_at'],
                    'note' => $validated['note'] ?? 'Manual stock adjustment',
                ]);

                $purchase->items()->create([
                    'product_variant_id' => $validated['product_variant_id'],
                    'qty' => $validated['qty'],
                    'remaining_qty' => $validated['qty'],
                    'cost_price' => 0,
                    'suggested_sell_price' => $latestSellPrice,
                ]);

                return;
            }

            $remainingToRemove = (int) $validated['qty'];
            $batches = PurchaseItem::query()
                ->where('product_variant_id', $validated['product_variant_id'])
                ->where('remaining_qty', '>', 0)
                ->join('purchases', 'purchases.id', '=', 'purchase_items.purchase_id')
                ->select('purchase_items.*')
                ->orderBy('purchases.purchased_at')
                ->orderBy('purchase_items.id')
                ->lockForUpdate()
                ->get();

            if ((int) $batches->sum('remaining_qty') < $remainingToRemove) {
                throw ValidationException::withMessages([
                    'qty' => ['The removal quantity exceeds available stock.'],
                ]);
            }

            foreach ($batches as $batch) {
                if ($remainingToRemove === 0) {
                    break;
                }

                $allocatedQuantity = min($remainingToRemove, $batch->remaining_qty);

                $adjustment->allocations()->create([
                    'purchase_item_id' => $batch->id,
                    'qty' => $allocatedQuantity,
                ]);

                $batch->decrement('remaining_qty', $allocatedQuantity);
                $remainingToRemove -= $allocatedQuantity;
            }
        });

        return to_route('adjustments.index')->with('flash', [
            'type' => 'success',
            'message' => 'Stock adjustment saved successfully.',
        ]);
    }
}
