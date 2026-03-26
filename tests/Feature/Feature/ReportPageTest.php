<?php

use App\Enums\PermissionName;
use App\Enums\SaleStatus;
use App\Enums\Size;
use App\Models\Category;
use App\Models\ExchangeRecord;
use App\Models\Product;
use App\Models\ReturnRecord;
use App\Models\Sale;
use App\Models\User;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    $this->withoutVite();
    Permission::findOrCreate(PermissionName::ViewDashboard->value, 'web');
});

test('users with report access can view reports page', function () {
    $user = User::factory()->create();
    $user->givePermissionTo(PermissionName::ViewDashboard->value);

    $this->actingAs($user);

    $this->get(route('reports.index'))->assertSuccessful();
});

test('reports page shows filtered aggregate data', function () {
    $user = User::factory()->create();
    $user->givePermissionTo(PermissionName::ViewDashboard->value);
    $category = Category::factory()->create();
    $product = Product::factory()->for($category)->create(['name' => 'Report Tee']);
    $variant = $product->variants()->create(['size' => Size::L->value]);

    $sale = Sale::create([
        'invoice_no' => 'INV-REP-001',
        'customer_name' => 'Report User',
        'status' => SaleStatus::Completed,
        'total_amount' => 30,
        'discount' => 2,
        'final_amount' => 28,
        'riel_exchange_rate' => 4100,
        'sold_at' => '2026-03-20 10:00:00',
    ]);

    $sale->items()->create([
        'product_variant_id' => $variant->id,
        'qty' => 3,
        'sell_price' => 10,
        'subtotal' => 30,
        'cost_total' => 12,
        'profit_total' => 18,
    ]);

    ReturnRecord::create([
        'sale_id' => $sale->id,
        'reference_no' => 'RET-REP-001',
        'refund_total' => 10,
        'returned_at' => '2026-03-20 11:00:00',
    ]);

    ExchangeRecord::create([
        'sale_id' => $sale->id,
        'reference_no' => 'EXC-REP-001',
        'difference_total' => 3,
        'exchanged_at' => '2026-03-20 12:00:00',
    ]);

    $this->actingAs($user);

    $response = $this->get(route('reports.index', [
        'start_date' => '2026-03-20',
        'end_date' => '2026-03-20',
    ]));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('reports/index')
        ->where('summary.orders_count', 1)
        ->where('summary.shirts_sold', 3)
        ->where('summary.sales_total', 28)
        ->where('summary.discount_total', 2)
        ->where('summary.cost_total', 12)
        ->where('summary.profit_total', 18)
        ->where('summary.returns_count', 1)
        ->where('summary.refund_total', 10)
        ->where('summary.exchanges_count', 1)
        ->where('summary.exchange_difference_total', 3)
        ->where('topProducts.0.product_name', 'Report Tee')
        ->where('topSizes.0.size', 'L'));
});

test('users without report access cannot view reports page', function () {
    $user = User::factory()->create();

    $this->actingAs($user);

    $this->get(route('reports.index'))->assertForbidden();
});
