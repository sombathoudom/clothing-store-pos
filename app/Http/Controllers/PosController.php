<?php

namespace App\Http\Controllers;

use App\Enums\SettingKey;
use App\Http\Requests\StoreSaleRequest;
use App\Models\Category;
use App\Models\ProductVariant;
use App\Support\BusinessSettings;
use App\Support\SaleCheckoutService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PosController extends Controller
{
    public function index(Request $request, BusinessSettings $businessSettings): Response
    {
        $search = $request->string('search')->toString();
        $categoryId = $request->integer('category_id');

        $variants = ProductVariant::query()
            ->select('product_variants.*')
            ->selectRaw('COALESCE(SUM(purchase_items.remaining_qty), 0) as current_stock')
            ->leftJoin('purchase_items', 'purchase_items.product_variant_id', '=', 'product_variants.id')
            ->join('products', 'products.id', '=', 'product_variants.product_id')
            ->join('categories', 'categories.id', '=', 'products.category_id')
            ->with([
                'product.category',
                'purchaseItems' => fn ($query) => $query
                    ->select('purchase_items.*')
                    ->join('purchases', 'purchases.id', '=', 'purchase_items.purchase_id')
                    ->orderByDesc('purchases.purchased_at')
                    ->orderByDesc('purchase_items.id'),
            ])
            ->where('products.is_active', true)
            ->when($search !== '', fn ($query) => $query->where('products.name', 'like', "%{$search}%"))
            ->when($categoryId > 0, fn ($query) => $query->where('categories.id', $categoryId))
            ->groupBy('product_variants.id', 'products.name', 'categories.name')
            ->orderBy('products.name')
            ->get()
            ->map(fn (ProductVariant $variant): array => [
                'id' => $variant->id,
                'product_name' => $variant->product->name,
                'image_url' => $variant->product->image_path === null
                    ? null
                    : Storage::url($variant->product->image_path),
                'category_id' => (string) $variant->product->category->id,
                'category_name' => $variant->product->category->name,
                'size' => $variant->size->value,
                'sku' => $variant->sku,
                'current_stock' => (int) $variant->current_stock,
                'suggested_sell_price' => $variant->purchaseItems->first()?->suggested_sell_price,
            ])
            ->values()
            ->all();

        return Inertia::render('pos/index', [
            'filters' => [
                'search' => $search,
                'category_id' => $categoryId > 0 ? (string) $categoryId : '',
            ],
            'categories' => Category::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(fn (Category $category): array => [
                    'id' => (string) $category->id,
                    'name' => $category->name,
                ])
                ->all(),
            'variants' => $variants,
            'invoicePreview' => $businessSettings->invoicePreview(),
            'rielExchangeRate' => $businessSettings->get(SettingKey::RielExchangeRate),
        ]);
    }

    public function store(StoreSaleRequest $request, SaleCheckoutService $saleCheckoutService): RedirectResponse
    {
        $sale = $saleCheckoutService->checkout($request->validated());

        return to_route('sales.show', $sale)->with('flash', [
            'type' => 'success',
            'message' => 'Checkout completed successfully.',
        ]);
    }
}
