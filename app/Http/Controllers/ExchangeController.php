<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreExchangeRequest;
use App\Models\ProductVariant;
use App\Models\Sale;
use App\Support\ExchangeService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ExchangeController extends Controller
{
    public function create(Sale $sale): Response
    {
        $sale->load([
            'items.productVariant.product.category',
            'items.returnItems',
            'items.exchangeItems',
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
                'suggested_sell_price' => $variant->purchaseItems()->latest('id')->value('suggested_sell_price'),
            ])
            ->all();

        return Inertia::render('exchanges/create', [
            'sale' => [
                'id' => $sale->id,
                'invoice_no' => $sale->invoice_no,
                'customer_name' => $sale->customer_name,
                'sold_at' => $sale->sold_at?->toDateTimeString(),
                'items' => $sale->items->map(fn ($item): array => [
                    'id' => $item->id,
                    'product_name' => $item->productVariant->product->name,
                    'category_name' => $item->productVariant->product->category->name,
                    'size' => $item->productVariant->size->value,
                    'qty' => $item->qty,
                    'sell_price' => $item->sell_price,
                    'already_returned_qty' => (int) $item->returnItems->sum('qty'),
                    'already_exchanged_qty' => (int) $item->exchangeItems->sum('qty'),
                    'available_to_exchange_qty' => $item->qty - (int) $item->returnItems->sum('qty') - (int) $item->exchangeItems->sum('qty'),
                ])->values()->all(),
            ],
            'variants' => $variants,
        ]);
    }

    public function store(
        StoreExchangeRequest $request,
        Sale $sale,
        ExchangeService $exchangeService,
    ): RedirectResponse {
        $exchangeService->create($sale, $request->validated());

        return to_route('sales.show', $sale)->with('flash', [
            'type' => 'success',
            'message' => 'Exchange created successfully.',
        ]);
    }
}
