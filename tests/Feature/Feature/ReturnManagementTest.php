<?php

use App\Enums\PermissionName;
use App\Enums\SaleStatus;
use App\Enums\Size;
use App\Models\Category;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\Sale;
use App\Models\User;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    $this->withoutVite();
    Permission::findOrCreate(PermissionName::ManageReturns->value, 'web');
    Permission::findOrCreate(PermissionName::ViewSales->value, 'web');
});

test('users with return permission can view return creation page', function () {
    $user = User::factory()->create();
    $user->givePermissionTo(PermissionName::ManageReturns->value);
    $sale = Sale::factory()->create([
        'status' => SaleStatus::Completed,
    ]);

    $this->actingAs($user);

    $this->get(route('returns.create', $sale))->assertSuccessful();
});

test('partial returns restore stock from original allocations', function () {
    $user = User::factory()->create();
    $user->givePermissionTo(PermissionName::ManageReturns->value);
    $user->givePermissionTo(PermissionName::ViewSales->value);
    $category = Category::factory()->create();
    $product = Product::factory()->for($category)->create();
    $variant = $product->variants()->create(['size' => Size::L->value]);
    $firstPurchase = Purchase::factory()->create(['purchased_at' => now()->subDay()]);
    $firstBatch = $firstPurchase->items()->create([
        'product_variant_id' => $variant->id,
        'qty' => 2,
        'remaining_qty' => 0,
        'cost_price' => 3.0000,
        'suggested_sell_price' => 8.0000,
    ]);
    $secondPurchase = Purchase::factory()->create(['purchased_at' => now()]);
    $secondBatch = $secondPurchase->items()->create([
        'product_variant_id' => $variant->id,
        'qty' => 3,
        'remaining_qty' => 1,
        'cost_price' => 4.0000,
        'suggested_sell_price' => 9.0000,
    ]);
    $sale = Sale::create([
        'invoice_no' => 'INV-RET-001',
        'customer_name' => 'Walk In',
        'status' => SaleStatus::Completed,
        'total_amount' => 40,
        'discount' => 0,
        'final_amount' => 40,
        'riel_exchange_rate' => 4100,
        'sold_at' => now(),
    ]);
    $saleItem = $sale->items()->create([
        'product_variant_id' => $variant->id,
        'qty' => 4,
        'sell_price' => 10,
        'subtotal' => 40,
        'cost_total' => 14,
        'profit_total' => 26,
    ]);
    $allocationA = $saleItem->allocations()->create([
        'purchase_item_id' => $firstBatch->id,
        'qty' => 2,
        'unit_cost' => 3,
        'total_cost' => 6,
    ]);
    $allocationB = $saleItem->allocations()->create([
        'purchase_item_id' => $secondBatch->id,
        'qty' => 2,
        'unit_cost' => 4,
        'total_cost' => 8,
    ]);

    $this->actingAs($user);

    $response = $this->post(route('returns.store', $sale), [
        'returned_at' => now()->format('Y-m-d H:i:s'),
        'items' => [
            [
                'sale_item_id' => $saleItem->id,
                'qty' => 3,
            ],
        ],
    ]);

    $response->assertRedirect(route('sales.show', $sale));
    expect($firstBatch->fresh()?->remaining_qty)->toBe(2);
    expect($secondBatch->fresh()?->remaining_qty)->toBe(2);
    expect($sale->returns()->first()?->refund_total)->toBe('30.00');
    expect($allocationA->returnAllocations()->sum('qty'))->toBe(2);
    expect($allocationB->returnAllocations()->sum('qty'))->toBe(1);
});

test('cannot return more than remaining sold quantity', function () {
    $user = User::factory()->create();
    $user->givePermissionTo(PermissionName::ManageReturns->value);
    $sale = Sale::factory()->create([
        'status' => SaleStatus::Completed,
    ]);
    $category = Category::factory()->create();
    $product = Product::factory()->for($category)->create();
    $variant = $product->variants()->create(['size' => Size::M->value]);
    $saleItem = $sale->items()->create([
        'product_variant_id' => $variant->id,
        'qty' => 1,
        'sell_price' => 7,
        'subtotal' => 7,
        'cost_total' => 3,
        'profit_total' => 4,
    ]);
    $sale->returns()->create([
        'reference_no' => 'RET-000001',
        'refund_total' => 7,
        'returned_at' => now(),
    ])->items()->create([
        'sale_item_id' => $saleItem->id,
        'qty' => 1,
        'refund_total' => 7,
    ]);

    $this->actingAs($user);

    $response = $this->from(route('returns.create', $sale))->post(route('returns.store', $sale), [
        'returned_at' => now()->format('Y-m-d H:i:s'),
        'items' => [
            [
                'sale_item_id' => $saleItem->id,
                'qty' => 1,
            ],
        ],
    ]);

    $response->assertRedirect(route('returns.create', $sale));
    $response->assertSessionHasErrors('items');
});

test('users without return permission cannot access returns', function () {
    $user = User::factory()->create();
    $sale = Sale::factory()->create();

    $this->actingAs($user);

    $this->get(route('returns.create', $sale))->assertForbidden();
});
