<?php

namespace App\Enums;

enum Size: string
{
    case M = 'M';
    case L = 'L';
    case XL = 'XL';
    case TwoXL = '2XL';
    case ThreeXL = '3XL';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
