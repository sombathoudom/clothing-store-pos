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
    Permission::findOrCreate(PermissionName::ManageExchanges->value, 'web');
});

test('users with exchange permission can view exchange creation page', function () {
    $user = User::factory()->create();
    $user->givePermissionTo(PermissionName::ManageExchanges->value);
    $sale = Sale::factory()->create([
        'status' => SaleStatus::Completed,
    ]);

    $this->actingAs($user);

    $this->get(route('exchanges.create', $sale))->assertSuccessful();
});

test('exchanges restore original stock and issue replacement stock', function () {
    $user = User::factory()->create();
    $user->givePermissionTo(PermissionName::ManageExchanges->value);
    $category = Category::factory()->create();
    $product = Product::factory()->for($category)->create(['name' => 'Classic Tee']);
    $oldVariant = $product->variants()->create(['size' => Size::M->value]);
    $newVariant = $product->variants()->create(['size' => Size::L->value]);

    $oldPurchase = Purchase::factory()->create(['purchased_at' => now()->subDay()]);
    $oldBatch = $oldPurchase->items()->create([
        'product_variant_id' => $oldVariant->id,
        'qty' => 2,
        'remaining_qty' => 0,
        'cost_price' => 3.0000,
        'suggested_sell_price' => 8.0000,
    ]);

    $replacementPurchase = Purchase::factory()->create(['purchased_at' => now()]);
    $replacementBatch = $replacementPurchase->items()->create([
        'product_variant_id' => $newVariant->id,
        'qty' => 4,
        'remaining_qty' => 4,
        'cost_price' => 4.5000,
        'suggested_sell_price' => 11.0000,
    ]);

    $sale = Sale::create([
        'invoice_no' => 'INV-EXC-001',
        'customer_name' => 'Walk In',
        'status' => SaleStatus::Completed,
        'total_amount' => 20,
        'discount' => 0,
        'final_amount' => 20,
        'riel_exchange_rate' => 4100,
        'sold_at' => now(),
    ]);

    $saleItem = $sale->items()->create([
        'product_variant_id' => $oldVariant->id,
        'qty' => 2,
        'sell_price' => 10,
        'subtotal' => 20,
        'cost_total' => 6,
        'profit_total' => 14,
    ]);

    $saleItem->allocations()->create([
        'purchase_item_id' => $oldBatch->id,
        'qty' => 2,
        'unit_cost' => 3,
        'total_cost' => 6,
    ]);

    $this->actingAs($user);

    $response = $this->post(route('exchanges.store', $sale), [
        'exchanged_at' => now()->format('Y-m-d H:i:s'),
        'items' => [
            [
                'sale_item_id' => $saleItem->id,
                'replacement_product_variant_id' => $newVariant->id,
                'qty' => 1,
                'new_unit_price' => 11,
            ],
        ],
    ]);

    $response->assertRedirect(route('sales.show', $sale));
    expect($oldBatch->fresh()?->remaining_qty)->toBe(1);
    expect($replacementBatch->fresh()?->remaining_qty)->toBe(3);
    expect($sale->exchanges()->first()?->difference_total)->toBe('1.00');
});

test('cannot exchange more than remaining sold quantity', function () {
    $user = User::factory()->create();
    $user->givePermissionTo(PermissionName::ManageExchanges->value);
    $category = Category::factory()->create();
    $product = Product::factory()->for($category)->create();
    $oldVariant = $product->variants()->create(['size' => Size::M->value]);
    $replacementVariant = $product->variants()->create(['size' => Size::L->value]);
    $sale = Sale::factory()->create([
        'status' => SaleStatus::Completed,
    ]);
    $saleItem = $sale->items()->create([
        'product_variant_id' => $oldVariant->id,
        'qty' => 1,
        'sell_price' => 10,
        'subtotal' => 10,
        'cost_total' => 5,
        'profit_total' => 5,
    ]);
    $sale->exchanges()->create([
        'reference_no' => 'EXC-000001',
        'difference_total' => 0,
        'exchanged_at' => now(),
    ])->items()->create([
        'sale_item_id' => $saleItem->id,
        'replacement_product_variant_id' => $replacementVariant->id,
        'qty' => 1,
        'old_unit_price' => 10,
        'new_unit_price' => 10,
        'difference_total' => 0,
    ]);

    $this->actingAs($user);

    $response = $this->from(route('exchanges.create', $sale))->post(route('exchanges.store', $sale), [
        'exchanged_at' => now()->format('Y-m-d H:i:s'),
        'items' => [
            [
                'sale_item_id' => $saleItem->id,
                'replacement_product_variant_id' => $replacementVariant->id,
                'qty' => 1,
                'new_unit_price' => 10,
            ],
        ],
    ]);

    $response->assertRedirect(route('exchanges.create', $sale));
    $response->assertSessionHasErrors('items');
});

test('multiple exchanges do not over-restore original stock allocations', function () {
    $user = User::factory()->create();
    $user->givePermissionTo(PermissionName::ManageExchanges->value);
    $category = Category::factory()->create();
    $product = Product::factory()->for($category)->create();
    $oldVariant = $product->variants()->create(['size' => Size::M->value]);
    $replacementVariant = $product->variants()->create(['size' => Size::L->value]);

    $oldPurchase = Purchase::factory()->create(['purchased_at' => now()->subDay()]);
    $oldBatch = $oldPurchase->items()->create([
        'product_variant_id' => $oldVariant->id,
        'qty' => 2,
        'remaining_qty' => 0,
        'cost_price' => 3.0000,
        'suggested_sell_price' => 8.0000,
    ]);

    $replacementPurchase = Purchase::factory()->create(['purchased_at' => now()]);
    $replacementBatch = $replacementPurchase->items()->create([
        'product_variant_id' => $replacementVariant->id,
        'qty' => 3,
        'remaining_qty' => 3,
        'cost_price' => 4.0000,
        'suggested_sell_price' => 9.0000,
    ]);

    $sale = Sale::create([
        'invoice_no' => 'INV-EXC-002',
        'customer_name' => 'Walk In',
        'status' => SaleStatus::Completed,
        'total_amount' => 20,
        'discount' => 0,
        'final_amount' => 20,
        'riel_exchange_rate' => 4100,
        'sold_at' => now(),
    ]);

    $saleItem = $sale->items()->create([
        'product_variant_id' => $oldVariant->id,
        'qty' => 2,
        'sell_price' => 10,
        'subtotal' => 20,
        'cost_total' => 6,
        'profit_total' => 14,
    ]);

    $saleItem->allocations()->create([
        'purchase_item_id' => $oldBatch->id,
        'qty' => 2,
        'unit_cost' => 3,
        'total_cost' => 6,
    ]);

    $this->actingAs($user);

    $this->post(route('exchanges.store', $sale), [
        'exchanged_at' => now()->format('Y-m-d H:i:s'),
        'items' => [[
            'sale_item_id' => $saleItem->id,
            'replacement_product_variant_id' => $replacementVariant->id,
            'qty' => 1,
            'new_unit_price' => 10,
        ]],
    ])->assertRedirect(route('sales.show', $sale));

    $this->post(route('exchanges.store', $sale), [
        'exchanged_at' => now()->format('Y-m-d H:i:s'),
        'items' => [[
            'sale_item_id' => $saleItem->id,
            'replacement_product_variant_id' => $replacementVariant->id,
            'qty' => 1,
            'new_unit_price' => 10,
        ]],
    ])->assertRedirect(route('sales.show', $sale));

    expect($oldBatch->fresh()?->remaining_qty)->toBe(2);
    expect($replacementBatch->fresh()?->remaining_qty)->toBe(1);
});

test('users without exchange permission cannot access exchanges', function () {
    $user = User::factory()->create();
    $sale = Sale::factory()->create();

    $this->actingAs($user);

    $this->get(route('exchanges.create', $sale))->assertForbidden();
});
