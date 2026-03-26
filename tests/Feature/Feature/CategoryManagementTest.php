<?php

use App\Enums\PermissionName;
use App\Models\Category;
use App\Models\User;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    $this->withoutVite();
    Permission::findOrCreate(PermissionName::ManageCategories->value, 'web');
});

test('users with category permission can view category management', function () {
    $user = User::factory()->create();
    $user->givePermissionTo(PermissionName::ManageCategories->value);

    $this->actingAs($user);

    $response = $this->get(route('categories.index'));

    $response->assertSuccessful();
});

test('users can create categories', function () {
    $user = User::factory()->create();
    $user->givePermissionTo(PermissionName::ManageCategories->value);

    $this->actingAs($user);

    $response = $this->post(route('categories.store'), [
        'name' => 'Hawai Shirt',
        'is_active' => true,
    ]);

    $response->assertRedirect(route('categories.index'));

    $category = Category::query()->first();

    expect($category)->not->toBeNull();
    expect($category?->name)->toBe('Hawai Shirt');
    expect($category?->slug)->toBe('hawai-shirt');
    expect($category?->is_active)->toBeTrue();
});

test('users can update categories', function () {
    $user = User::factory()->create();
    $user->givePermissionTo(PermissionName::ManageCategories->value);
    $category = Category::factory()->create([
        'name' => 'Old Category',
        'slug' => 'old-category',
    ]);

    $this->actingAs($user);

    $response = $this->put(route('categories.update', $category), [
        'name' => 'Hawai Premium',
        'is_active' => false,
    ]);

    $response->assertRedirect(route('categories.index'));

    expect($category->fresh()?->name)->toBe('Hawai Premium');
    expect($category->fresh()?->slug)->toBe('hawai-premium');
    expect($category->fresh()?->is_active)->toBeFalse();
});

test('users without category permission cannot access category management', function () {
    $user = User::factory()->create();

    $this->actingAs($user);

    $response = $this->get(route('categories.index'));

    $response->assertForbidden();
});
