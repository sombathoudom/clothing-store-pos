<?php

namespace App\Enums;

enum PermissionName: string
{
    case ManageBusinessSettings = 'manage business settings';
    case ManageUsers = 'manage users';
    case ManageRoles = 'manage roles';
    case ViewDashboard = 'view dashboard';
    case ManageCategories = 'manage categories';
    case ManageProducts = 'manage products';
    case ManagePurchases = 'manage purchases';
    case ManageAdjustments = 'manage adjustments';
    case ViewStock = 'view stock';
    case CreateSales = 'create sales';
    case ViewSales = 'view sales';
    case ManageSaleStatuses = 'manage sale statuses';
    case ManageReturns = 'manage returns';
    case ManageExchanges = 'manage exchanges';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
