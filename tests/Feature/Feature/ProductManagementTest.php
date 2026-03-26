<?php

use App\Enums\PermissionName;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    $this->withoutVite();
    Permission::findOrCreate(PermissionName::ManageProducts->value, 'web');
});

test('users with product permission can view product management', function () {
    $user = User::factory()->create();
    $user->givePermissionTo(PermissionName::ManageProducts->value);

    $this->actingAs($user);

    $response = $this->get(route('products.index'));

    $response->assertSuccessful();
});

test('users can create products with variants', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $user->givePermissionTo(PermissionName::ManageProducts->value);
    $category = Category::factory()->create();

    $this->actingAs($user);

    $response = $this->post(route('products.store'), [
        'category_id' => $category->id,
        'name' => 'Hawai Premium',
        'image' => UploadedFile::fake()->image('hawai-premium.jpg'),
        'is_active' => true,
        'sizes' => ['M', 'XL'],
    ]);

    $response->assertRedirect(route('products.index'));

    $product = Product::query()->with('variants')->first();

    expect($product)->not->toBeNull();
    expect($product?->name)->toBe('Hawai Premium');
    expect($product?->image_path)->not->toBeNull();
    expect($product?->variants->map(fn ($variant) => $variant->size->value)->all())->toBe(['M', 'XL']);
    Storage::disk('public')->assertExists($product?->image_path);
});

test('users can update product variants by syncing sizes', function () {
    $user = User::factory()->create();
    $user->givePermissionTo(PermissionName::ManageProducts->value);
    $category = Category::factory()->create();
    $product = Product::factory()->for($category)->create();
    $product->variants()->createMany([
        ['size' => 'M'],
        ['size' => 'L'],
    ]);

    $this->actingAs($user);

    $response = $this->put(route('products.update', $product), [
        'category_id' => $category->id,
        'name' => 'Hawai Shirt',
        'is_active' => false,
        'sizes' => ['L', 'XL'],
    ]);

    $response->assertRedirect(route('products.index'));

    $product->refresh()->load('variants');

    expect($product->name)->toBe('Hawai Shirt');
    expect($product->is_active)->toBeFalse();
    expect($product->variants->map(fn ($variant) => $variant->size->value)->sort()->values()->all())->toBe(['L', 'XL']);
});

test('users without product permission cannot access product management', function () {
    $user = User::factory()->create();

    $this->actingAs($user);

    $response = $this->get(route('products.index'));

    $response->assertForbidden();
});
