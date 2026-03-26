<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePurchaseRequest;
use App\Models\ProductVariant;
use App\Models\Purchase;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();

        $purchases = Purchase::query()
            ->withCount('items')
            ->withSum('items', 'qty')
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($nestedQuery) use ($search) {
                    $nestedQuery
                        ->where('reference_no', 'like', "%{$search}%")
                        ->orWhere('supplier_name', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('purchased_at')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (Purchase $purchase): array => [
                'id' => $purchase->id,
                'reference_no' => $purchase->reference_no,
                'supplier_name' => $purchase->supplier_name,
                'purchased_at' => $purchase->purchased_at?->toDateTimeString(),
                'items_count' => $purchase->items_count,
                'total_qty' => (int) ($purchase->items_sum_qty ?? 0),
                'created_at' => $purchase->created_at?->toDateTimeString(),
            ]);

        return Inertia::render('purchases/index', [
            'purchases' => $purchases,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('purchases/create', [
            'products' => $this->productOptions(),
        ]);
    }

    public function store(StorePurchaseRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $purchase = DB::transaction(function () use ($validated): Purchase {
            $purchase = Purchase::create([
                'reference_no' => $validated['reference_no'] ?? null,
                'supplier_name' => $validated['supplier_name'] ?? null,
                'purchased_at' => $validated['purchased_at'],
                'note' => $validated['note'] ?? null,
            ]);

            $purchase->items()->createMany(
                collect($validated['items'])
                    ->map(fn (array $item): array => [
                        'product_variant_id' => $item['product_variant_id'],
                        'qty' => $item['qty'],
                        'remaining_qty' => $item['qty'],
                        'cost_price' => $item['cost_price'],
                        'suggested_sell_price' => $item['suggested_sell_price'] ?? null,
                    ])
                    ->all(),
            );

            return $purchase;
        });

        return to_route('purchases.show', $purchase)->with('flash', [
            'type' => 'success',
            'message' => 'Purchase recorded successfully.',
        ]);
    }

    public function show(Purchase $purchase): Response
    {
        $purchase->load([
            'items.productVariant.product.category',
        ]);

        return Inertia::render('purchases/show', [
            'purchase' => [
                'id' => $purchase->id,
                'reference_no' => $purchase->reference_no,
                'supplier_name' => $purchase->supplier_name,
                'purchased_at' => $purchase->purchased_at?->toDateTimeString(),
                'note' => $purchase->note,
                'items' => $purchase->items->map(fn ($item): array => [
                    'id' => $item->id,
                    'product_name' => $item->productVariant->product->name,
                    'category_name' => $item->productVariant->product->category->name,
                    'size' => $item->productVariant->size->value,
                    'qty' => $item->qty,
                    'remaining_qty' => $item->remaining_qty,
                    'cost_price' => $item->cost_price,
                    'suggested_sell_price' => $item->suggested_sell_price,
                ])->values()->all(),
            ],
        ]);
    }

    /**
     * @return array<int, array{id: string, name: string, category: string, image_url: string|null, variants: array<int, array{id: string, size: string, stock: int}>}>
     */
    private function productOptions(): array
    {
        return ProductVariant::query()
            ->with(['product.category', 'purchaseItems'])
            ->orderBy('product_id')
            ->orderBy('size')
            ->get()
            ->groupBy('product_id')
            ->map(function ($variants): array {
                /** @var ProductVariant $firstVariant */
                $firstVariant = $variants->first();

                return [
                    'id' => (string) $firstVariant->product_id,
                    'name' => $firstVariant->product->name,
                    'category' => $firstVariant->product->category->name,
                    'image_url' => $firstVariant->product->image_path === null
                        ? null
                        : Storage::url($firstVariant->product->image_path),
                    'variants' => $variants
                        ->map(fn (ProductVariant $variant): array => [
                            'id' => (string) $variant->id,
                            'size' => $variant->size->value,
                            'stock' => (int) $variant->purchaseItems->sum('remaining_qty'),
                        ])
                        ->values()
                        ->all(),
                ];
            })
            ->values()
            ->all();
    }
}
