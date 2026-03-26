<?php

use App\Enums\PermissionName;
use App\Enums\SettingKey;
use App\Enums\Size;
use App\Models\Category;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\Sale;
use App\Models\Setting;
use App\Models\User;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    $this->withoutVite();
    Permission::findOrCreate(PermissionName::CreateSales->value, 'web');
    Permission::findOrCreate(PermissionName::ViewSales->value, 'web');
});

test('users with sales permission can view pos', function () {
    $user = User::factory()->create();
    $user->givePermissionTo(PermissionName::CreateSales->value);

    $this->actingAs($user);

    $response = $this->get(route('pos.index'));

    $response->assertSuccessful();
});

test('checkout creates sale with invoice number and fifo allocations', function () {
    $user = User::factory()->create();
    $user->givePermissionTo(PermissionName::CreateSales->value);
    $user->givePermissionTo(PermissionName::ViewSales->value);

    Setting::query()->updateOrCreate(
        ['key' => SettingKey::InvoicePrefix->value],
        ['value' => 'SALE'],
    );
    Setting::query()->updateOrCreate(
        ['key' => SettingKey::InvoiceNextNumber->value],
        ['value' => '15'],
    );
    Setting::query()->updateOrCreate(
        ['key' => SettingKey::InvoiceNumberPadding->value],
        ['value' => '6'],
    );

    $category = Category::factory()->create();
    $product = Product::factory()->for($category)->create(['name' => 'Ocean Tee']);
    $variant = $product->variants()->create(['size' => Size::L->value]);

    $firstPurchase = Purchase::factory()->create([
        'purchased_at' => now()->subDay(),
    ]);
    $firstBatch = $firstPurchase->items()->create([
        'product_variant_id' => $variant->id,
        'qty' => 2,
        'remaining_qty' => 2,
        'cost_price' => 3.0000,
        'suggested_sell_price' => 8.0000,
    ]);
    $secondPurchase = Purchase::factory()->create([
        'purchased_at' => now(),
    ]);
    $secondBatch = $secondPurchase->items()->create([
        'product_variant_id' => $variant->id,
        'qty' => 3,
        'remaining_qty' => 3,
        'cost_price' => 4.0000,
        'suggested_sell_price' => 9.0000,
    ]);

    $this->actingAs($user);

    $response = $this->post(route('pos.checkout'), [
        'customer_name' => 'Walk In',
        'discount' => 2,
        'items' => [
            [
                'product_variant_id' => $variant->id,
                'qty' => 4,
                'sell_price' => 10,
            ],
        ],
    ]);

    $sale = Sale::query()->with('items.allocations')->first();

    $response->assertRedirect(route('sales.show', $sale));
    expect($sale?->invoice_no)->toBe('SALE-000015');
    expect((string) $sale?->total_amount)->toBe('40.00');
    expect((string) $sale?->final_amount)->toBe('38.00');
    expect($sale?->items)->toHaveCount(1);
    expect((string) $sale?->items->first()?->cost_total)->toBe('14.00');
    expect((string) $sale?->items->first()?->profit_total)->toBe('26.00');
    expect($sale?->items->first()?->allocations)->toHaveCount(2);
    expect($firstBatch->fresh()?->remaining_qty)->toBe(0);
    expect($secondBatch->fresh()?->remaining_qty)->toBe(1);
    expect(Setting::query()->where('key', SettingKey::InvoiceNextNumber->value)->value('value'))->toBe('16');
});

test('checkout fails when requested quantity exceeds stock', function () {
    $user = User::factory()->create();
    $user->givePermissionTo(PermissionName::CreateSales->value);

    $category = Category::factory()->create();
    $product = Product::factory()->for($category)->create();
    $variant = $product->variants()->create(['size' => Size::M->value]);
    $purchase = Purchase::factory()->create();
    $purchase->items()->create([
        'product_variant_id' => $variant->id,
        'qty' => 2,
        'remaining_qty' => 2,
        'cost_price' => 2.5000,
        'suggested_sell_price' => 6.0000,
    ]);

    $this->actingAs($user);

    $response = $this->from(route('pos.index'))->post(route('pos.checkout'), [
        'items' => [
            [
                'product_variant_id' => $variant->id,
                'qty' => 3,
                'sell_price' => 7,
            ],
        ],
    ]);

    $response->assertRedirect(route('pos.index'));
    $response->assertSessionHasErrors('items');
    expect(Sale::query()->count())->toBe(0);
});

test('users without create sales permission cannot access pos', function () {
    $user = User::factory()->create();

    $this->actingAs($user);

    $response = $this->get(route('pos.index'));

    $response->assertForbidden();
});
