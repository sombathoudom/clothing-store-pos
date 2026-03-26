<?php

namespace App\Http\Controllers;

use App\Models\ExchangeRecord;
use App\Models\ReturnRecord;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $startDate = $request->string('start_date')->toString() ?: now()->startOfMonth()->toDateString();
        $endDate = $request->string('end_date')->toString() ?: now()->toDateString();

        $salesSummary = Sale::query()
            ->whereBetween('sold_at', ["{$startDate} 00:00:00", "{$endDate} 23:59:59"])
            ->selectRaw('COUNT(*) as orders_count')
            ->selectRaw('COALESCE(SUM(total_amount), 0) as total_amount')
            ->selectRaw('COALESCE(SUM(discount), 0) as discount_total')
            ->selectRaw('COALESCE(SUM(final_amount), 0) as final_amount')
            ->first();

        $saleItemSummary = SaleItem::query()
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->whereBetween('sales.sold_at', ["{$startDate} 00:00:00", "{$endDate} 23:59:59"])
            ->selectRaw('COALESCE(SUM(sale_items.qty), 0) as quantity_total')
            ->selectRaw('COALESCE(SUM(sale_items.cost_total), 0) as cost_total')
            ->selectRaw('COALESCE(SUM(sale_items.profit_total), 0) as profit_total')
            ->first();

        $returnsSummary = ReturnRecord::query()
            ->whereBetween('returned_at', ["{$startDate} 00:00:00", "{$endDate} 23:59:59"])
            ->selectRaw('COUNT(*) as returns_count')
            ->selectRaw('COALESCE(SUM(refund_total), 0) as refund_total')
            ->first();

        $exchangesSummary = ExchangeRecord::query()
            ->whereBetween('exchanged_at', ["{$startDate} 00:00:00", "{$endDate} 23:59:59"])
            ->selectRaw('COUNT(*) as exchanges_count')
            ->selectRaw('COALESCE(SUM(difference_total), 0) as difference_total')
            ->first();

        $topProducts = SaleItem::query()
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->join('product_variants', 'product_variants.id', '=', 'sale_items.product_variant_id')
            ->join('products', 'products.id', '=', 'product_variants.product_id')
            ->whereBetween('sales.sold_at', ["{$startDate} 00:00:00", "{$endDate} 23:59:59"])
            ->selectRaw('products.name as product_name')
            ->selectRaw('COALESCE(SUM(sale_items.qty), 0) as quantity_total')
            ->selectRaw('COALESCE(SUM(sale_items.subtotal), 0) as sales_total')
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('quantity_total')
            ->limit(5)
            ->get()
            ->map(fn ($row): array => [
                'product_name' => $row->product_name,
                'quantity_total' => (int) $row->quantity_total,
                'sales_total' => round((float) $row->sales_total, 2),
            ])
            ->all();

        $topSizes = SaleItem::query()
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->join('product_variants', 'product_variants.id', '=', 'sale_items.product_variant_id')
            ->whereBetween('sales.sold_at', ["{$startDate} 00:00:00", "{$endDate} 23:59:59"])
            ->selectRaw('product_variants.size as size')
            ->selectRaw('COALESCE(SUM(sale_items.qty), 0) as quantity_total')
            ->groupBy('product_variants.size')
            ->orderByDesc('quantity_total')
            ->limit(5)
            ->get()
            ->map(fn ($row): array => [
                'size' => $row->size,
                'quantity_total' => (int) $row->quantity_total,
            ])
            ->all();

        return Inertia::render('reports/index', [
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
            'summary' => [
                'orders_count' => (int) ($salesSummary?->orders_count ?? 0),
                'shirts_sold' => (int) ($saleItemSummary?->quantity_total ?? 0),
                'sales_total' => round((float) ($salesSummary?->final_amount ?? 0), 2),
                'gross_sales_total' => round((float) ($salesSummary?->total_amount ?? 0), 2),
                'discount_total' => round((float) ($salesSummary?->discount_total ?? 0), 2),
                'cost_total' => round((float) ($saleItemSummary?->cost_total ?? 0), 2),
                'profit_total' => round((float) ($saleItemSummary?->profit_total ?? 0), 2),
                'returns_count' => (int) ($returnsSummary?->returns_count ?? 0),
                'refund_total' => round((float) ($returnsSummary?->refund_total ?? 0), 2),
                'exchanges_count' => (int) ($exchangesSummary?->exchanges_count ?? 0),
                'exchange_difference_total' => round((float) ($exchangesSummary?->difference_total ?? 0), 2),
            ],
            'topProducts' => $topProducts,
            'topSizes' => $topSizes,
        ]);
    }
}
