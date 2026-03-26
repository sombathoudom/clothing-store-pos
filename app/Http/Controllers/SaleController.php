<?php

namespace App\Http\Controllers;

use App\Enums\SaleStatus;
use App\Enums\SettingKey;
use App\Models\Sale;
use App\Support\BusinessSettings;
use App\Support\SaleStatusTransitionService;
use App\Support\ThermalReceiptPrinter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class SaleController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();

        $sales = Sale::query()
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($nestedQuery) use ($search) {
                    $nestedQuery
                        ->where('invoice_no', 'like', "%{$search}%")
                        ->orWhere('customer_name', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('sold_at')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (Sale $sale): array => [
                'id' => $sale->id,
                'invoice_no' => $sale->invoice_no,
                'customer_name' => $sale->customer_name,
                'status' => $sale->status->value,
                'total_amount' => $sale->total_amount,
                'discount' => $sale->discount,
                'final_amount' => $sale->final_amount,
                'sold_at' => $sale->sold_at?->toDateTimeString(),
            ]);

        return Inertia::render('sales/index', [
            'sales' => $sales,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function show(Sale $sale): Response
    {
        $transitionService = app(SaleStatusTransitionService::class);

        $sale->load([
            'items.productVariant.product.category',
            'items.allocations.purchaseItem.purchase',
        ]);

        return Inertia::render('sales/show', [
            'sale' => [
                'id' => $sale->id,
                'invoice_no' => $sale->invoice_no,
                'customer_name' => $sale->customer_name,
                'customer_phone' => $sale->customer_phone,
                'customer_address' => $sale->customer_address,
                'status' => $sale->status->value,
                'total_amount' => $sale->total_amount,
                'discount' => $sale->discount,
                'final_amount' => $sale->final_amount,
                'riel_exchange_rate' => $sale->riel_exchange_rate,
                'sold_at' => $sale->sold_at?->toDateTimeString(),
                'available_transitions' => $transitionService->availableTransitions($sale),
                'timeline' => collect(SaleStatus::cases())
                    ->map(function (SaleStatus $status) use ($sale): array {
                        $order = [
                            SaleStatus::Pending->value,
                            SaleStatus::Shipping->value,
                            SaleStatus::Delivered->value,
                            SaleStatus::Completed->value,
                            SaleStatus::Cancelled->value,
                        ];

                        $currentIndex = array_search($sale->status->value, $order, true);
                        $statusIndex = array_search($status->value, $order, true);

                        return [
                            'value' => $status->value,
                            'is_current' => $sale->status === $status,
                            'is_complete' => $currentIndex !== false
                                && $statusIndex !== false
                                && $statusIndex <= $currentIndex
                                && $sale->status !== SaleStatus::Cancelled,
                        ];
                    })
                    ->all(),
                'items' => $sale->items->map(fn ($item): array => [
                    'id' => $item->id,
                    'product_name' => $item->productVariant->product->name,
                    'category_name' => $item->productVariant->product->category->name,
                    'size' => $item->productVariant->size->value,
                    'qty' => $item->qty,
                    'sell_price' => $item->sell_price,
                    'subtotal' => $item->subtotal,
                    'cost_total' => $item->cost_total,
                    'profit_total' => $item->profit_total,
                    'allocations' => $item->allocations->map(fn ($allocation): array => [
                        'id' => $allocation->id,
                        'qty' => $allocation->qty,
                        'unit_cost' => $allocation->unit_cost,
                        'total_cost' => $allocation->total_cost,
                        'purchase_reference_no' => $allocation->purchaseItem->purchase->reference_no,
                        'purchase_supplier_name' => $allocation->purchaseItem->purchase->supplier_name,
                        'purchase_date' => $allocation->purchaseItem->purchase->purchased_at?->toDateTimeString(),
                    ])->values()->all(),
                ])->values()->all(),
            ],
        ]);
    }

    public function receipt(Sale $sale, BusinessSettings $businessSettings): Response
    {
        $sale->load([
            'items.productVariant.product.category',
        ]);

        return Inertia::render('sales/receipt', [
            'sale' => [
                'id' => $sale->id,
                'invoice_no' => $sale->invoice_no,
                'customer_name' => $sale->customer_name,
                'customer_phone' => $sale->customer_phone,
                'status' => $sale->status->value,
                'total_amount' => $sale->total_amount,
                'discount' => $sale->discount,
                'final_amount' => $sale->final_amount,
                'riel_exchange_rate' => $sale->riel_exchange_rate,
                'sold_at' => $sale->sold_at?->toDateTimeString(),
                'items' => $sale->items->map(fn ($item): array => [
                    'id' => $item->id,
                    'product_name' => $item->productVariant->product->name,
                    'size' => $item->productVariant->size->value,
                    'qty' => $item->qty,
                    'sell_price' => $item->sell_price,
                    'subtotal' => $item->subtotal,
                ])->values()->all(),
            ],
            'store' => [
                'name' => $businessSettings->get(SettingKey::StoreName),
                'phone' => $businessSettings->get(SettingKey::StorePhone),
                'footer' => $businessSettings->get(SettingKey::ReceiptFooter),
            ],
        ]);
    }

    public function print(Sale $sale, ThermalReceiptPrinter $printer): RedirectResponse
    {
        try {
            $printer->printSale($sale);

            return to_route('sales.show', $sale)->with('flash', [
                'type' => 'success',
                'message' => 'Receipt sent to printer successfully.',
            ]);
        } catch (RuntimeException $exception) {
            return to_route('sales.show', $sale)->with('flash', [
                'type' => 'error',
                'message' => $exception->getMessage(),
            ]);
        }
    }

    public function markShipping(Sale $sale, SaleStatusTransitionService $transitionService): RedirectResponse
    {
        $transitionService->transition($sale, SaleStatus::Shipping);

        return to_route('sales.show', $sale)->with('flash', [
            'type' => 'success',
            'message' => 'Sale marked as shipping.',
        ]);
    }

    public function markDelivered(Sale $sale, SaleStatusTransitionService $transitionService): RedirectResponse
    {
        $transitionService->transition($sale, SaleStatus::Delivered);

        return to_route('sales.show', $sale)->with('flash', [
            'type' => 'success',
            'message' => 'Sale marked as delivered.',
        ]);
    }

    public function markCompleted(Sale $sale, SaleStatusTransitionService $transitionService): RedirectResponse
    {
        $transitionService->transition($sale, SaleStatus::Completed);

        return to_route('sales.show', $sale)->with('flash', [
            'type' => 'success',
            'message' => 'Sale marked as completed.',
        ]);
    }

    public function cancel(Sale $sale, SaleStatusTransitionService $transitionService): RedirectResponse
    {
        $transitionService->transition($sale, SaleStatus::Cancelled);

        return to_route('sales.show', $sale)->with('flash', [
            'type' => 'success',
            'message' => 'Sale cancelled successfully.',
        ]);
    }
}
