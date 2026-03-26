<?php

namespace App\Enums;

enum SettingKey: string
{
    case InvoicePrefix = 'invoice_prefix';
    case InvoiceNextNumber = 'invoice_next_number';
    case InvoiceNumberPadding = 'invoice_number_padding';
    case RielExchangeRate = 'riel_exchange_rate';
    case LowStockThreshold = 'low_stock_threshold';
    case StoreName = 'store_name';
    case StorePhone = 'store_phone';
    case ReceiptFooter = 'receipt_footer';
    case PrinterIp = 'printer_ip';
    case PrinterPort = 'printer_port';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
