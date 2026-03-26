<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreReturnRequest;
use App\Models\Sale;
use App\Support\ReturnService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ReturnController extends Controller
{
    public function create(Sale $sale): Response
    {
        $sale->load([
            'items.productVariant.product.category',
            'items.returnItems',
        ]);

        return Inertia::render('returns/create', [
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
                    'available_to_return_qty' => $item->qty - (int) $item->returnItems->sum('qty'),
                ])->values()->all(),
            ],
        ]);
    }

    public function store(
        StoreReturnRequest $request,
        Sale $sale,
        ReturnService $returnService,
    ): RedirectResponse {
        $returnService->create($sale, $request->validated());

        return to_route('sales.show', $sale)->with('flash', [
            'type' => 'success',
            'message' => 'Return created successfully.',
        ]);
    }
}
