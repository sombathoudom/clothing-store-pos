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
    Permission::findOrCreate(PermissionName::ManageAdjustments->value, 'web');
});

test('users with adjustment permission can view adjustments', function () {
    $user = User::factory()->create();
    $user->givePermissionTo(PermissionName::ManageAdjustments->value);

    $this->actingAs($user);

    $response = $this->get(route('adjustments.index'));

    $response->assertSuccessful();
});

test('users can add stock through manual adjustment', function () {
    $user = User::factory()->create();
    $user->givePermissionTo(PermissionName::ManageAdjustments->value);
    $category = Category::factory()->create();
    $product = Product::factory()->for($category)->create();
    $variant = $product->variants()->create(['size' => Size::L->value]);

    $this->actingAs($user);

    $response = $this->post(route('adjustments.store'), [
        'product_variant_id' => $variant->id,
        'type' => 'add',
        'reason' => 'manual_restock',
        'qty' => 4,
        'performed_at' => now()->format('Y-m-d H:i:s'),
    ]);

    $response->assertRedirect(route('adjustments.index'));
    expect($variant->purchaseItems()->sum('remaining_qty'))->toBe(4);
});

test('users can remove stock using fifo batches', function () {
    $user = User::factory()->create();
    $user->givePermissionTo(PermissionName::ManageAdjustments->value);
    $category = Category::factory()->create();
    $product = Product::factory()->for($category)->create(['name' => 'Polo']);
    $variant = $product->variants()->create(['size' => Size::XL->value]);
    $firstPurchase = Purchase::factory()->create(['purchased_at' => now()->subDay()]);
    $firstBatch = $firstPurchase->items()->create([
        'product_variant_id' => $variant->id,
        'qty' => 3,
        'remaining_qty' => 3,
        'cost_price' => 2.5000,
        'suggested_sell_price' => 7.5000,
    ]);
    $secondPurchase = Purchase::factory()->create(['purchased_at' => now()]);
    $secondBatch = $secondPurchase->items()->create([
        'product_variant_id' => $variant->id,
        'qty' => 4,
        'remaining_qty' => 4,
        'cost_price' => 2.9000,
        'suggested_sell_price' => 8.0000,
    ]);

    $this->actingAs($user);

    $response = $this->post(route('adjustments.store'), [
        'product_variant_id' => $variant->id,
        'type' => 'remove',
        'reason' => 'damage',
        'qty' => 5,
        'performed_at' => now()->format('Y-m-d H:i:s'),
    ]);

    $response->assertRedirect(route('adjustments.index'));
    expect($firstBatch->fresh()?->remaining_qty)->toBe(0);
    expect($secondBatch->fresh()?->remaining_qty)->toBe(2);
});

test('stock removal adjustment cannot exceed available stock', function () {
    $user = User::factory()->create();
    $user->givePermissionTo(PermissionName::ManageAdjustments->value);
    $category = Category::factory()->create();
    $product = Product::factory()->for($category)->create();
    $variant = $product->variants()->create(['size' => Size::M->value]);
    $purchase = Purchase::factory()->create();
    $purchase->items()->create([
        'product_variant_id' => $variant->id,
        'qty' => 2,
        'remaining_qty' => 2,
        'cost_price' => 1.5000,
        'suggested_sell_price' => 5.0000,
    ]);

    $this->actingAs($user);

    $response = $this->from(route('adjustments.index'))->post(route('adjustments.store'), [
        'product_variant_id' => $variant->id,
        'type' => 'remove',
        'reason' => 'missing',
        'qty' => 3,
        'performed_at' => now()->format('Y-m-d H:i:s'),
    ]);

    $response->assertRedirect(route('adjustments.index'));
    $response->assertSessionHasErrors('qty');
});

test('users without adjustment permission cannot access adjustments', function () {
    $user = User::factory()->create();

    $this->actingAs($user);

    $response = $this->get(route('adjustments.index'));

    $response->assertForbidden();
});
