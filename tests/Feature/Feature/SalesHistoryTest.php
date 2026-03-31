<?php

use App\Enums\PermissionName;
use App\Enums\SaleStatus;
use App\Enums\SettingKey;
use App\Models\Sale;
use App\Models\Setting;
use App\Models\User;
use App\Support\ThermalReceiptPrinter;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    $this->withoutVite();
    Permission::findOrCreate(PermissionName::ViewSales->value, 'web');
    Permission::findOrCreate(PermissionName::ManageSaleStatuses->value, 'web');
});

test('users with sales permission can view sales history', function () {
    $user = User::factory()->create();
    $user->givePermissionTo(PermissionName::ViewSales->value);

    Sale::factory()->create([
        'invoice_no' => 'INV-100001',
        'status' => SaleStatus::Completed,
    ]);

    $this->actingAs($user);

    $response = $this->get(route('sales.index'));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('sales/index')
        ->where('sales.data.0.invoice_no', 'INV-100001'));
});

test('sales detail shows saved invoice data', function () {
    $user = User::factory()->create();
    $user->givePermissionTo(PermissionName::ViewSales->value);

    $sale = Sale::factory()->create([
        'invoice_no' => 'INV-200001',
        'status' => SaleStatus::Completed,
    ]);

    $this->actingAs($user);

    $response = $this->get(route('sales.show', $sale));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('sales/show')
        ->where('sale.invoice_no', 'INV-200001'));
});

test('users with sales permission can view receipt page', function () {
    $user = User::factory()->create();
    $user->givePermissionTo(PermissionName::ViewSales->value);
    Setting::updateOrCreate([
        'key' => SettingKey::ReceiptPaperWidth->value,
    ], [
        'value' => '80mm',
    ]);

    $sale = Sale::factory()->create([
        'invoice_no' => 'INV-REC-001',
        'status' => SaleStatus::Completed,
    ]);

    $this->actingAs($user);

    $this->get(route('sales.receipt', $sale))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('sales/receipt')
            ->where('store.paper_width', '80mm')
            ->where('sale.invoice_no', 'INV-REC-001'));
});

test('users can send a sale receipt to the thermal printer', function () {
    $user = User::factory()->create();
    $user->givePermissionTo(PermissionName::ViewSales->value);

    $sale = Sale::factory()->create([
        'invoice_no' => 'INV-PRINT-001',
        'status' => SaleStatus::Completed,
    ]);

    $printer = Mockery::mock(ThermalReceiptPrinter::class);
    $printer->shouldReceive('printSale')->once()->with(Mockery::on(fn ($model) => $model->is($sale)));
    $this->app->instance(ThermalReceiptPrinter::class, $printer);

    $this->actingAs($user);

    $this->post(route('sales.print', $sale))
        ->assertRedirect(route('sales.show', $sale))
        ->assertSessionHas('flash.message', 'Receipt sent to printer successfully.');
});

test('users without sales permission cannot access sales history', function () {
    $user = User::factory()->create();

    $this->actingAs($user);

    $response = $this->get(route('sales.index'));

    $response->assertForbidden();
});

test('authorized users can move a sale through allowed status transitions', function () {
    $user = User::factory()->create();
    $user->givePermissionTo(PermissionName::ViewSales->value);
    $user->givePermissionTo(PermissionName::ManageSaleStatuses->value);

    $sale = Sale::factory()->create([
        'status' => SaleStatus::Pending,
    ]);

    $this->actingAs($user);

    $this->patch(route('sales.status.shipping', $sale))->assertRedirect(route('sales.show', $sale));
    expect($sale->fresh()?->status)->toBe(SaleStatus::Shipping);

    $this->patch(route('sales.status.delivered', $sale))->assertRedirect(route('sales.show', $sale));
    expect($sale->fresh()?->status)->toBe(SaleStatus::Delivered);

    $this->patch(route('sales.status.completed', $sale))->assertRedirect(route('sales.show', $sale));
    expect($sale->fresh()?->status)->toBe(SaleStatus::Completed);
});

test('invalid status transitions are rejected', function () {
    $user = User::factory()->create();
    $user->givePermissionTo(PermissionName::ViewSales->value);
    $user->givePermissionTo(PermissionName::ManageSaleStatuses->value);

    $sale = Sale::factory()->create([
        'status' => SaleStatus::Pending,
    ]);

    $this->actingAs($user);

    $response = $this->from(route('sales.show', $sale))
        ->patch(route('sales.status.completed', $sale));

    $response->assertRedirect(route('sales.show', $sale));
    $response->assertSessionHasErrors('status');
    expect($sale->fresh()?->status)->toBe(SaleStatus::Pending);
});

test('users without status permission cannot change sale status', function () {
    $user = User::factory()->create();
    $user->givePermissionTo(PermissionName::ViewSales->value);

    $sale = Sale::factory()->create([
        'status' => SaleStatus::Pending,
    ]);

    $this->actingAs($user);

    $this->patch(route('sales.status.shipping', $sale))->assertForbidden();
    expect($sale->fresh()?->status)->toBe(SaleStatus::Pending);
});
