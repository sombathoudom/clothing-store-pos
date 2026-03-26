<?php

namespace App\Enums;

enum RoleName: string
{
    case Admin = 'Admin';
    case Manager = 'Manager';
    case Cashier = 'Cashier';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
