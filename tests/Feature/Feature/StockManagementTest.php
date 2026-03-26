<?php

use App\Enums\PermissionName;
use App\Enums\SettingKey;
use App\Enums\Size;
use App\Models\Category;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\Setting;
use App\Models\User;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    $this->withoutVite();
    Permission::findOrCreate(PermissionName::ViewStock->value, 'web');
});

test('users with stock permission can view stock overview', function () {
    $user = User::factory()->create();
    $user->givePermissionTo(PermissionName::ViewStock->value);

    $this->actingAs($user);

    $response = $this->get(route('stock.index'));

    $response->assertSuccessful();
});

test('stock overview aggregates remaining quantities by variant', function () {
    $user = User::factory()->create();
    $user->givePermissionTo(PermissionName::ViewStock->value);
    $category = Category::factory()->create();
    $product = Product::factory()->for($category)->create(['name' => 'Ocean Shirt']);
    $variant = $product->variants()->create(['size' => Size::XL->value]);

    $firstPurchase = Purchase::factory()->create();
    $firstPurchase->items()->create([
        'product_variant_id' => $variant->id,
        'qty' => 10,
        'remaining_qty' => 4,
        'cost_price' => 2.1000,
        'suggested_sell_price' => 5.5000,
    ]);

    $secondPurchase = Purchase::factory()->create();
    $secondPurchase->items()->create([
        'product_variant_id' => $variant->id,
        'qty' => 6,
        'remaining_qty' => 3,
        'cost_price' => 2.4000,
        'suggested_sell_price' => 5.8000,
    ]);

    $this->actingAs($user);

    $response = $this->get(route('stock.index'));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('stock/index')
        ->where('lowStockThreshold', 5)
        ->where('variants.data.0.product_name', 'Ocean Shirt')
        ->where('variants.data.0.current_stock', 7)
        ->where('variants.data.0.is_low_stock', false));
});

test('stock overview respects the configured low stock threshold', function () {
    $user = User::factory()->create();
    $user->givePermissionTo(PermissionName::ViewStock->value);
    Setting::updateOrCreate([
        'key' => SettingKey::LowStockThreshold->value,
    ], [
        'value' => '10',
    ]);
    $category = Category::factory()->create();
    $product = Product::factory()->for($category)->create(['name' => 'Threshold Shirt']);
    $variant = $product->variants()->create(['size' => Size::M->value]);
    $purchase = Purchase::factory()->create();
    $purchase->items()->create([
        'product_variant_id' => $variant->id,
        'qty' => 12,
        'remaining_qty' => 7,
        'cost_price' => 2.1000,
        'suggested_sell_price' => 5.5000,
    ]);

    $this->actingAs($user);

    $response = $this->get(route('stock.index'));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('stock/index')
        ->where('lowStockThreshold', 10)
        ->where('variants.data.0.product_name', 'Threshold Shirt')
        ->where('variants.data.0.is_low_stock', true));
});

test('stock detail shows batch breakdown for a variant', function () {
    $user = User::factory()->create();
    $user->givePermissionTo(PermissionName::ViewStock->value);
    $category = Category::factory()->create();
    $product = Product::factory()->for($category)->create(['name' => 'Premium Polo']);
    $variant = $product->variants()->create(['size' => Size::L->value]);
    $purchase = Purchase::factory()->create([
        'reference_no' => 'PO-STOCK-1',
    ]);

    $purchase->items()->create([
        'product_variant_id' => $variant->id,
        'qty' => 15,
        'remaining_qty' => 9,
        'cost_price' => 3.2500,
        'suggested_sell_price' => 7.5000,
    ]);

    $this->actingAs($user);

    $response = $this->get(route('stock.show', $variant));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('stock/show')
        ->where('variant.product_name', 'Premium Polo')
        ->where('variant.current_stock', 9)
        ->where('variant.batches.0.reference_no', 'PO-STOCK-1')
        ->where('variant.batches.0.remaining_qty', 9));
});

test('users without stock permission cannot access stock pages', function () {
    $user = User::factory()->create();

    $this->actingAs($user);

    $response = $this->get(route('stock.index'));

    $response->assertForbidden();
});
