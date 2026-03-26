<?php

use App\Enums\PermissionName;
use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $this->withoutVite();
});

test('users with direct permission can view user management', function () {
    Permission::findOrCreate(PermissionName::ManageUsers->value, 'web');

    $user = User::factory()->create();
    $user->givePermissionTo(PermissionName::ManageUsers->value);

    $this->actingAs($user);

    $response = $this->get(route('users.index'));

    $response->assertSuccessful();
});

test('users combine role and direct permissions', function () {
    Permission::findOrCreate(PermissionName::ManageUsers->value, 'web');
    Permission::findOrCreate(PermissionName::ManageRoles->value, 'web');

    $role = Role::findOrCreate('Supervisor', 'web');
    $role->givePermissionTo(PermissionName::ManageUsers->value);

    $user = User::factory()->create();
    $user->assignRole($role);
    $user->givePermissionTo(PermissionName::ManageRoles->value);

    expect($user->can(PermissionName::ManageUsers->value))->toBeTrue();
    expect($user->can(PermissionName::ManageRoles->value))->toBeTrue();
});

test('users without permission cannot access user management', function () {
    $user = User::factory()->create();

    $this->actingAs($user);

    $response = $this->get(route('users.index'));

    $response->assertForbidden();
});
