<?php

use App\Enums\PermissionName;
use App\Enums\Size;
use App\Models\Category;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\User;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    $this->withoutVite();
    Permission::findOrCreate(PermissionName::ManagePurchases->value, 'web');
});

test('users with purchase permission can view purchases', function () {
    $user = User::factory()->create();
    $user->givePermissionTo(PermissionName::ManagePurchases->value);

    $this->actingAs($user);

    $response = $this->get(route('purchases.index'));

    $response->assertSuccessful();
});

test('users can create purchase batches with remaining qty equal to qty', function () {
    $user = User::factory()->create();
    $user->givePermissionTo(PermissionName::ManagePurchases->value);
    $category = Category::factory()->create();
    $product = Product::factory()->for($category)->create();
    $variantM = $product->variants()->create(['size' => Size::M->value]);
    $variantL = $product->variants()->create(['size' => Size::L->value]);

    $this->actingAs($user);

    $response = $this->post(route('purchases.store'), [
        'reference_no' => 'PO-001',
        'supplier_name' => 'Ocean Supplier',
        'purchased_at' => now()->format('Y-m-d H:i:s'),
        'note' => 'First delivery',
        'items' => [
            [
                'product_variant_id' => $variantM->id,
                'qty' => 12,
                'cost_price' => 2.1400,
                'suggested_sell_price' => 6.0000,
            ],
            [
                'product_variant_id' => $variantL->id,
                'qty' => 8,
                'cost_price' => 2.2500,
                'suggested_sell_price' => 6.5000,
            ],
        ],
    ]);

    $purchase = Purchase::query()->with('items')->first();

    $response->assertRedirect(route('purchases.show', $purchase));
    expect($purchase)->not->toBeNull();
    expect($purchase?->items)->toHaveCount(2);
    expect($purchase?->items->pluck('qty')->all())->toBe([12, 8]);
    expect($purchase?->items->pluck('remaining_qty')->all())->toBe([12, 8]);
});

test('purchase creation requires at least one line item', function () {
    $user = User::factory()->create();
    $user->givePermissionTo(PermissionName::ManagePurchases->value);

    $this->actingAs($user);

    $response = $this->from(route('purchases.create'))->post(route('purchases.store'), [
        'reference_no' => 'PO-EMPTY',
        'purchased_at' => now()->format('Y-m-d H:i:s'),
        'items' => [],
    ]);

    $response->assertRedirect(route('purchases.create'));
    $response->assertSessionHasErrors('items');
});

test('users without purchase permission cannot access purchase management', function () {
    $user = User::factory()->create();

    $this->actingAs($user);

    $response = $this->get(route('purchases.index'));

    $response->assertForbidden();
});
