<?php

use App\Enums\PermissionName;
use App\Enums\RoleName;
use App\Enums\SettingKey;
use App\Models\Setting;
use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $this->withoutVite();
});

test('users without permission cannot access business settings', function () {
    $user = User::factory()->create();

    $this->actingAs($user);

    $response = $this->get(route('business-settings.edit'));

    $response->assertForbidden();
});

test('admins can update business settings', function () {
    Permission::findOrCreate(PermissionName::ManageBusinessSettings->value, 'web');
    $adminRole = Role::findOrCreate(RoleName::Admin->value, 'web');

    $user = User::factory()->create();
    $user->assignRole($adminRole);

    $this->actingAs($user);

    $response = $this->put(route('business-settings.update'), [
        'store_name' => 'Clothing House',
        'store_phone' => '012345678',
        'invoice_prefix' => 'SALE',
        'invoice_next_number' => 12,
        'invoice_number_padding' => 6,
        'riel_exchange_rate' => 4200,
        'low_stock_threshold' => 7,
        'receipt_footer' => 'Thanks again',
        'receipt_paper_width' => '80mm',
        'printer_ip' => '192.168.1.25',
        'printer_port' => 9100,
    ]);

    $response->assertRedirect(route('business-settings.edit'))
        ->assertSessionHas('flash.message', 'Business settings updated successfully.');

    expect(Setting::query()->where('key', SettingKey::StoreName->value)->value('value'))->toBe('Clothing House');
    expect(Setting::query()->where('key', SettingKey::InvoicePrefix->value)->value('value'))->toBe('SALE');
    expect(Setting::query()->where('key', SettingKey::InvoiceNextNumber->value)->value('value'))->toBe('12');
    expect(Setting::query()->where('key', SettingKey::RielExchangeRate->value)->value('value'))->toBe('4200');
    expect(Setting::query()->where('key', SettingKey::LowStockThreshold->value)->value('value'))->toBe('7');
    expect(Setting::query()->where('key', SettingKey::ReceiptPaperWidth->value)->value('value'))->toBe('80mm');
    expect(Setting::query()->where('key', SettingKey::PrinterIp->value)->value('value'))->toBe('192.168.1.25');
});
