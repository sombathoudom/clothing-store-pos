<?php

namespace App\Enums;

enum SaleStatus: string
{
    case Pending = 'pending';
    case Shipping = 'shipping';
    case Delivered = 'delivered';
    case Completed = 'completed';
    case Cancelled = 'cancelled';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
