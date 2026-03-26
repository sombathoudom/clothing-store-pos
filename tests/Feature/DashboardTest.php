<?php

use App\Enums\PermissionName;
use App\Enums\SettingKey;
use App\Models\Category;
use App\Models\ExchangeRecord;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\ReturnRecord;
use App\Models\Sale;
use App\Models\Setting;
use App\Models\User;
use Spatie\Permission\Models\Permission;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('users with dashboard permission can visit the dashboard', function () {
    Permission::findOrCreate(PermissionName::ViewDashboard->value, 'web');

    $user = User::factory()->create();
    $user->givePermissionTo(PermissionName::ViewDashboard->value);

    $this->actingAs($user);

    $response = $this->get(route('dashboard'));

    $response->assertSuccessful();
});

test('dashboard shows real summary data', function () {
    Permission::findOrCreate(PermissionName::ViewDashboard->value, 'web');

    $user = User::factory()->create();
    $user->givePermissionTo(PermissionName::ViewDashboard->value);

    $category = Category::factory()->create();
    Setting::updateOrCreate([
        'key' => SettingKey::LowStockThreshold->value,
    ], [
        'value' => '2',
    ]);
    $product = Product::factory()->for($category)->create(['name' => 'Island Tee']);
    $variant = $product->variants()->create(['size' => 'L']);
    $purchase = Purchase::factory()->create();
    $purchase->items()->create([
        'product_variant_id' => $variant->id,
        'qty' => 4,
        'remaining_qty' => 2,
        'cost_price' => 3.0000,
        'suggested_sell_price' => 8.0000,
    ]);

    $sale = Sale::factory()->create([
        'invoice_no' => 'INV-300001',
        'final_amount' => 25,
        'total_amount' => 25,
        'discount' => 0,
        'sold_at' => now(),
    ]);

    $sale->items()->create([
        'product_variant_id' => $variant->id,
        'qty' => 3,
        'sell_price' => 8.3333,
        'subtotal' => 25.00,
        'cost_total' => 9.00,
        'profit_total' => 16.00,
    ]);

    ReturnRecord::create([
        'sale_id' => $sale->id,
        'reference_no' => 'RET-000001',
        'refund_total' => 8,
        'returned_at' => now(),
    ]);

    ExchangeRecord::create([
        'sale_id' => $sale->id,
        'reference_no' => 'EXC-000001',
        'difference_total' => 2,
        'exchanged_at' => now(),
    ]);

    $this->actingAs($user);

    $response = $this->get(route('dashboard'));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('dashboard')
        ->where('summary.orders_today', 1)
        ->where('summary.shirts_sold_today', 3)
        ->where('summary.sales_today', 25)
        ->where('summary.cost_today', 9)
        ->where('summary.profit_today', 16)
        ->where('summary.returns_today', 1)
        ->where('summary.refunds_today', 8)
        ->where('summary.exchanges_today', 1)
        ->where('summary.exchange_difference_today', 2)
        ->where('recentSales.0.invoice_no', 'INV-300001')
        ->where('recentReturns.0.reference_no', 'RET-000001')
        ->where('recentExchanges.0.reference_no', 'EXC-000001')
        ->where('lowStockThreshold', 2)
        ->where('lowStockVariants.0.product_name', 'Island Tee'));
});

test('users without dashboard permission cannot visit the dashboard', function () {
    $user = User::factory()->create();

    $this->actingAs($user);

    $response = $this->get(route('dashboard'));

    $response->assertForbidden();
});
