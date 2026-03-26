<?php

namespace App\Http\Controllers;

use App\Enums\SettingKey;
use App\Models\Category;
use App\Models\ProductVariant;
use App\Support\BusinessSettings;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StockController extends Controller
{
    public function index(Request $request, BusinessSettings $businessSettings): Response
    {
        $search = $request->string('search')->toString();
        $categoryId = $request->integer('category_id');
        $size = $request->string('size')->toString();
        $lowStockOnly = $request->boolean('low_stock_only');
        $lowStockThreshold = (int) $businessSettings->get(SettingKey::LowStockThreshold);

        $variants = ProductVariant::query()
            ->select('product_variants.*')
            ->selectRaw('COALESCE(SUM(purchase_items.remaining_qty), 0) as current_stock')
            ->leftJoin('purchase_items', 'purchase_items.product_variant_id', '=', 'product_variants.id')
            ->join('products', 'products.id', '=', 'product_variants.product_id')
            ->join('categories', 'categories.id', '=', 'products.category_id')
            ->with(['product.category'])
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($nestedQuery) use ($search) {
                    $nestedQuery
                        ->where('products.name', 'like', "%{$search}%")
                        ->orWhere('categories.name', 'like', "%{$search}%");
                });
            })
            ->when($categoryId > 0, fn ($query) => $query->where('categories.id', $categoryId))
            ->when($size !== '', fn ($query) => $query->where('product_variants.size', $size))
            ->groupBy('product_variants.id', 'products.name', 'categories.name')
            ->when($lowStockOnly, fn ($query) => $query->havingRaw('COALESCE(SUM(purchase_items.remaining_qty), 0) <= ?', [$lowStockThreshold]))
            ->orderBy('products.name')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (ProductVariant $variant): array => [
                'id' => $variant->id,
                'product_name' => $variant->product->name,
                'category_name' => $variant->product->category->name,
                'size' => $variant->size->value,
                'sku' => $variant->sku,
                'current_stock' => (int) $variant->current_stock,
                'is_low_stock' => (int) $variant->current_stock <= $lowStockThreshold,
            ]);

        return Inertia::render('stock/index', [
            'variants' => $variants,
            'filters' => [
                'search' => $search,
                'category_id' => $categoryId > 0 ? (string) $categoryId : '',
                'size' => $size,
                'low_stock_only' => $lowStockOnly,
            ],
            'lowStockThreshold' => $lowStockThreshold,
            'categories' => Category::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(fn (Category $category): array => [
                    'id' => (string) $category->id,
                    'name' => $category->name,
                ])
                ->all(),
        ]);
    }

    public function show(ProductVariant $productVariant): Response
    {
        $productVariant->load([
            'product.category',
            'purchaseItems' => fn ($query) => $query
                ->select('purchase_items.*')
                ->join('purchases', 'purchases.id', '=', 'purchase_items.purchase_id')
                ->with('purchase:id,reference_no,supplier_name,purchased_at')
                ->orderByDesc('purchases.purchased_at')
                ->orderByDesc('purchase_items.id'),
        ]);

        $totalStock = (int) $productVariant->purchaseItems->sum('remaining_qty');

        return Inertia::render('stock/show', [
            'variant' => [
                'id' => $productVariant->id,
                'product_name' => $productVariant->product->name,
                'category_name' => $productVariant->product->category->name,
                'size' => $productVariant->size->value,
                'sku' => $productVariant->sku,
                'current_stock' => $totalStock,
                'batches' => $productVariant->purchaseItems->map(fn ($item): array => [
                    'id' => $item->id,
                    'reference_no' => $item->purchase->reference_no,
                    'supplier_name' => $item->purchase->supplier_name,
                    'purchased_at' => $item->purchase->purchased_at?->toDateTimeString(),
                    'qty' => $item->qty,
                    'remaining_qty' => $item->remaining_qty,
                    'cost_price' => $item->cost_price,
                    'suggested_sell_price' => $item->suggested_sell_price,
                ])->values()->all(),
            ],
        ]);
    }
}
