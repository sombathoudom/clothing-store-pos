<?php

use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ExchangeController;
use App\Http\Controllers\PosController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\ReturnController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\StockAdjustmentController;
use App\Http\Controllers\StockController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)
        ->middleware('can:view dashboard')
        ->name('dashboard');

    Route::get('users', [UserController::class, 'index'])
        ->middleware('can:manage users')
        ->name('users.index');
    Route::get('users/create', [UserController::class, 'create'])
        ->middleware('can:manage users')
        ->name('users.create');
    Route::post('users', [UserController::class, 'store'])
        ->middleware('can:manage users')
        ->name('users.store');
    Route::get('users/{user}/edit', [UserController::class, 'edit'])
        ->middleware('can:manage users')
        ->name('users.edit');
    Route::put('users/{user}', [UserController::class, 'update'])
        ->middleware('can:manage users')
        ->name('users.update');

    Route::get('roles', [RoleController::class, 'index'])
        ->middleware('can:manage roles')
        ->name('roles.index');
    Route::get('roles/create', [RoleController::class, 'create'])
        ->middleware('can:manage roles')
        ->name('roles.create');
    Route::post('roles', [RoleController::class, 'store'])
        ->middleware('can:manage roles')
        ->name('roles.store');
    Route::get('roles/{role}/edit', [RoleController::class, 'edit'])
        ->middleware('can:manage roles')
        ->name('roles.edit');
    Route::put('roles/{role}', [RoleController::class, 'update'])
        ->middleware('can:manage roles')
        ->name('roles.update');

    Route::get('categories', [CategoryController::class, 'index'])
        ->middleware('can:manage categories')
        ->name('categories.index');
    Route::get('categories/create', [CategoryController::class, 'create'])
        ->middleware('can:manage categories')
        ->name('categories.create');
    Route::post('categories', [CategoryController::class, 'store'])
        ->middleware('can:manage categories')
        ->name('categories.store');
    Route::get('categories/{category}/edit', [CategoryController::class, 'edit'])
        ->middleware('can:manage categories')
        ->name('categories.edit');
    Route::put('categories/{category}', [CategoryController::class, 'update'])
        ->middleware('can:manage categories')
        ->name('categories.update');

    Route::get('products', [ProductController::class, 'index'])
        ->middleware('can:manage products')
        ->name('products.index');
    Route::get('products/create', [ProductController::class, 'create'])
        ->middleware('can:manage products')
        ->name('products.create');
    Route::post('products', [ProductController::class, 'store'])
        ->middleware('can:manage products')
        ->name('products.store');
    Route::get('products/{product}/edit', [ProductController::class, 'edit'])
        ->middleware('can:manage products')
        ->name('products.edit');
    Route::put('products/{product}', [ProductController::class, 'update'])
        ->middleware('can:manage products')
        ->name('products.update');

    Route::get('purchases', [PurchaseController::class, 'index'])
        ->middleware('can:manage purchases')
        ->name('purchases.index');
    Route::get('purchases/create', [PurchaseController::class, 'create'])
        ->middleware('can:manage purchases')
        ->name('purchases.create');
    Route::post('purchases', [PurchaseController::class, 'store'])
        ->middleware('can:manage purchases')
        ->name('purchases.store');
    Route::get('purchases/{purchase}', [PurchaseController::class, 'show'])
        ->middleware('can:manage purchases')
        ->name('purchases.show');

    Route::get('stock', [StockController::class, 'index'])
        ->middleware('can:view stock')
        ->name('stock.index');
    Route::get('stock/{productVariant}', [StockController::class, 'show'])
        ->middleware('can:view stock')
        ->name('stock.show');

    Route::get('adjustments', [StockAdjustmentController::class, 'index'])
        ->middleware('can:manage adjustments')
        ->name('adjustments.index');
    Route::post('adjustments', [StockAdjustmentController::class, 'store'])
        ->middleware('can:manage adjustments')
        ->name('adjustments.store');

    Route::get('pos', [PosController::class, 'index'])
        ->middleware('can:create sales')
        ->name('pos.index');
    Route::post('pos/checkout', [PosController::class, 'store'])
        ->middleware('can:create sales')
        ->name('pos.checkout');

    Route::get('sales', [SaleController::class, 'index'])
        ->middleware('can:view sales')
        ->name('sales.index');
    Route::get('sales/{sale}', [SaleController::class, 'show'])
        ->middleware('can:view sales')
        ->name('sales.show');
    Route::get('sales/{sale}/receipt', [SaleController::class, 'receipt'])
        ->middleware('can:view sales')
        ->name('sales.receipt');
    Route::post('sales/{sale}/print', [SaleController::class, 'print'])
        ->middleware('can:view sales')
        ->name('sales.print');
    Route::patch('sales/{sale}/status/shipping', [SaleController::class, 'markShipping'])
        ->middleware('can:manage sale statuses')
        ->name('sales.status.shipping');
    Route::patch('sales/{sale}/status/delivered', [SaleController::class, 'markDelivered'])
        ->middleware('can:manage sale statuses')
        ->name('sales.status.delivered');
    Route::patch('sales/{sale}/status/completed', [SaleController::class, 'markCompleted'])
        ->middleware('can:manage sale statuses')
        ->name('sales.status.completed');
    Route::patch('sales/{sale}/status/cancelled', [SaleController::class, 'cancel'])
        ->middleware('can:manage sale statuses')
        ->name('sales.status.cancelled');

    Route::get('sales/{sale}/returns/create', [ReturnController::class, 'create'])
        ->middleware('can:manage returns')
        ->name('returns.create');
    Route::post('sales/{sale}/returns', [ReturnController::class, 'store'])
        ->middleware('can:manage returns')
        ->name('returns.store');

    Route::get('sales/{sale}/exchanges/create', [ExchangeController::class, 'create'])
        ->middleware('can:manage exchanges')
        ->name('exchanges.create');
    Route::post('sales/{sale}/exchanges', [ExchangeController::class, 'store'])
        ->middleware('can:manage exchanges')
        ->name('exchanges.store');

    Route::get('reports', ReportController::class)
        ->middleware('can:view dashboard')
        ->name('reports.index');
});

require __DIR__.'/settings.php';
