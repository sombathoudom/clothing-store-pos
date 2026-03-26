<?php

namespace App\Enums;

enum StockAdjustmentReason: string
{
    case Damage = 'damage';
    case Missing = 'missing';
    case CountCorrection = 'count_correction';
    case ManualRestock = 'manual_restock';
    case Other = 'other';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
