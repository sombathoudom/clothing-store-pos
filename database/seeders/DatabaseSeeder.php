<?php

namespace Database\Seeders;

use App\Enums\PermissionName;
use App\Enums\RoleName;
use App\Models\Setting;
use App\Models\User;
use App\Support\BusinessSettings;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach (PermissionName::values() as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        $adminRole = Role::findOrCreate(RoleName::Admin->value, 'web');
        $managerRole = Role::findOrCreate(RoleName::Manager->value, 'web');
        $cashierRole = Role::findOrCreate(RoleName::Cashier->value, 'web');

        $adminRole->syncPermissions(PermissionName::values());
        $managerRole->syncPermissions([
            PermissionName::ViewDashboard->value,
            PermissionName::ManageCategories->value,
            PermissionName::ManageProducts->value,
            PermissionName::ManagePurchases->value,
            PermissionName::ManageAdjustments->value,
            PermissionName::ViewStock->value,
            PermissionName::CreateSales->value,
            PermissionName::ViewSales->value,
            PermissionName::ManageSaleStatuses->value,
            PermissionName::ManageReturns->value,
            PermissionName::ManageExchanges->value,
        ]);
        $cashierRole->syncPermissions([
            PermissionName::CreateSales->value,
            PermissionName::ViewSales->value,
        ]);

        $settings = app(BusinessSettings::class)->defaults();

        foreach ($settings as $key => $value) {
            Setting::updateOrCreate(['key' => $key], ['value' => $value]);
        }

        $admin = User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => 'password',
        ]);

        $admin->assignRole($adminRole);

        $cashier = User::factory()->create([
            'name' => 'Cashier User',
            'email' => 'cashier@example.com',
            'password' => 'password',
        ]);

        $cashier->assignRole($cashierRole);
    }
}
