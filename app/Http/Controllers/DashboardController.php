<?php

namespace App\Http\Controllers;

use App\Enums\SettingKey;
use App\Models\ExchangeRecord;
use App\Models\ProductVariant;
use App\Models\ReturnRecord;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Support\BusinessSettings;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(BusinessSettings $businessSettings): Response
    {
        $lowStockThreshold = (int) $businessSettings->get(SettingKey::LowStockThreshold);

        $todaySales = Sale::query()
            ->whereDate('sold_at', today())
            ->selectRaw('COUNT(*) as orders_count')
            ->selectRaw('COALESCE(SUM(total_amount), 0) as total_amount')
            ->selectRaw('COALESCE(SUM(final_amount), 0) as final_amount')
            ->first();

        $todaySaleItems = SaleItem::query()
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->whereDate('sales.sold_at', today())
            ->selectRaw('COALESCE(SUM(sale_items.qty), 0) as shirts_sold')
            ->selectRaw('COALESCE(SUM(sale_items.cost_total), 0) as cost_total')
            ->selectRaw('COALESCE(SUM(sale_items.profit_total), 0) as profit_total')
            ->first();

        $todayReturns = ReturnRecord::query()
            ->whereDate('returned_at', today())
            ->selectRaw('COUNT(*) as returns_count')
            ->selectRaw('COALESCE(SUM(refund_total), 0) as refund_total')
            ->first();

        $todayExchanges = ExchangeRecord::query()
            ->whereDate('exchanged_at', today())
            ->selectRaw('COUNT(*) as exchanges_count')
            ->selectRaw('COALESCE(SUM(difference_total), 0) as difference_total')
            ->first();

        $recentSales = Sale::query()
            ->latest('sold_at')
            ->limit(5)
            ->get()
            ->map(fn (Sale $sale): array => [
                'id' => $sale->id,
                'invoice_no' => $sale->invoice_no,
                'customer_name' => $sale->customer_name,
                'final_amount' => $sale->final_amount,
                'sold_at' => $sale->sold_at?->toDateTimeString(),
                'status' => $sale->status->value,
            ])
            ->all();

        $recentReturns = ReturnRecord::query()
            ->with('sale:id,invoice_no')
            ->latest('returned_at')
            ->limit(5)
            ->get()
            ->map(fn (ReturnRecord $return): array => [
                'id' => $return->id,
                'reference_no' => $return->reference_no,
                'invoice_no' => $return->sale->invoice_no,
                'refund_total' => $return->refund_total,
                'returned_at' => $return->returned_at?->toDateTimeString(),
            ])
            ->all();

        $recentExchanges = ExchangeRecord::query()
            ->with('sale:id,invoice_no')
            ->latest('exchanged_at')
            ->limit(5)
            ->get()
            ->map(fn (ExchangeRecord $exchange): array => [
                'id' => $exchange->id,
                'reference_no' => $exchange->reference_no,
                'invoice_no' => $exchange->sale->invoice_no,
                'difference_total' => $exchange->difference_total,
                'exchanged_at' => $exchange->exchanged_at?->toDateTimeString(),
            ])
            ->all();

        $lowStockVariants = ProductVariant::query()
            ->select('product_variants.*')
            ->selectRaw('COALESCE(SUM(purchase_items.remaining_qty), 0) as current_stock')
            ->leftJoin('purchase_items', 'purchase_items.product_variant_id', '=', 'product_variants.id')
            ->join('products', 'products.id', '=', 'product_variants.product_id')
            ->join('categories', 'categories.id', '=', 'products.category_id')
            ->with(['product.category'])
            ->groupBy('product_variants.id', 'products.name', 'categories.name')
            ->havingRaw('COALESCE(SUM(purchase_items.remaining_qty), 0) <= ?', [$lowStockThreshold])
            ->orderBy('current_stock')
            ->orderBy('products.name')
            ->limit(5)
            ->get()
            ->map(fn (ProductVariant $variant): array => [
                'id' => $variant->id,
                'product_name' => $variant->product->name,
                'category_name' => $variant->product->category->name,
                'size' => $variant->size->value,
                'current_stock' => (int) $variant->current_stock,
            ])
            ->all();

        return Inertia::render('dashboard', [
            'summary' => [
                'orders_today' => (int) ($todaySales?->orders_count ?? 0),
                'shirts_sold_today' => (int) ($todaySaleItems?->shirts_sold ?? 0),
                'sales_today' => round((float) ($todaySales?->final_amount ?? 0), 2),
                'cost_today' => round((float) ($todaySaleItems?->cost_total ?? 0), 2),
                'profit_today' => round((float) ($todaySaleItems?->profit_total ?? 0), 2),
                'returns_today' => (int) ($todayReturns?->returns_count ?? 0),
                'refunds_today' => round((float) ($todayReturns?->refund_total ?? 0), 2),
                'exchanges_today' => (int) ($todayExchanges?->exchanges_count ?? 0),
                'exchange_difference_today' => round((float) ($todayExchanges?->difference_total ?? 0), 2),
            ],
            'recentSales' => $recentSales,
            'recentReturns' => $recentReturns,
            'recentExchanges' => $recentExchanges,
            'lowStockVariants' => $lowStockVariants,
            'lowStockThreshold' => $lowStockThreshold,
        ]);
    }
}
