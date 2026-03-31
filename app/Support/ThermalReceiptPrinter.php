<?php

namespace App\Support;

use App\Enums\SettingKey;
use App\Models\Sale;
use RuntimeException;

class ThermalReceiptPrinter
{
    public function __construct(private BusinessSettings $businessSettings) {}

    public function printSale(Sale $sale): void
    {
        $printerIp = trim($this->businessSettings->get(SettingKey::PrinterIp));
        $printerPort = (int) $this->businessSettings->get(SettingKey::PrinterPort);

        if ($printerIp === '') {
            throw new RuntimeException('Printer IP is not configured.');
        }

        $socket = @fsockopen($printerIp, $printerPort, $errorCode, $errorMessage, 5);

        if ($socket === false) {
            throw new RuntimeException(sprintf('Unable to connect to printer: %s', $errorMessage));
        }

        fwrite($socket, $this->buildReceipt($sale));
        fclose($socket);
    }

    private function buildReceipt(Sale $sale): string
    {
        $sale->loadMissing(['items.productVariant.product.category']);

        $storeName = $this->businessSettings->get(SettingKey::StoreName);
        $storePhone = $this->businessSettings->get(SettingKey::StorePhone);
        $receiptFooter = $this->businessSettings->get(SettingKey::ReceiptFooter);
        $paperWidth = $this->businessSettings->get(SettingKey::ReceiptPaperWidth);
        $width = $paperWidth === '80mm' ? 56 : 42;

        $lines = [
            "\x1B@",
            "\x1Ba\x01",
            $this->center($storeName, $width),
            $storePhone !== '' ? $this->center($storePhone, $width) : '',
            $this->center('RECEIPT', $width),
            "\x1Ba\x00",
            str_repeat('-', $width),
            $this->line('Invoice', $sale->invoice_no, $width),
            $this->line('Date', $sale->sold_at?->format('Y-m-d H:i') ?? '', $width),
            $this->line('Customer', $sale->customer_name ?? 'Walk-in', $width),
            str_repeat('-', $width),
        ];

        foreach ($sale->items as $item) {
            $lines[] = $item->productVariant->product->name.' / '.$item->productVariant->size->value;
            $lines[] = $this->line(
                sprintf('%sx %s', $item->qty, number_format((float) $item->sell_price, 2)),
                number_format((float) $item->subtotal, 2),
                $width,
            );
        }

        $lines = array_merge($lines, [
            str_repeat('-', $width),
            $this->line('Subtotal', number_format((float) $sale->total_amount, 2), $width),
            $this->line('Discount', number_format((float) $sale->discount, 2), $width),
            $this->line('Total', number_format((float) $sale->final_amount, 2), $width),
            $this->line(
                'KHR',
                number_format((float) $sale->final_amount * (float) $sale->riel_exchange_rate, 0),
                $width,
            ),
            str_repeat('-', $width),
            "\x1Ba\x01",
            $this->center($receiptFooter, $width),
            "\x1Ba\x00",
            "\n\n\n",
            "\x1DV\x00",
        ]);

        return implode("\n", array_filter($lines, fn ($line) => $line !== ''));
    }

    private function line(string $left, string $right, int $width): string
    {
        $rightWidth = $width <= 42 ? 14 : 18;
        $leftWidth = $width - $rightWidth - 2;
        $left = mb_strimwidth($left, 0, $leftWidth, '');
        $right = mb_strimwidth($right, 0, $rightWidth, '');
        $spaces = max($width - mb_strwidth($left) - mb_strwidth($right), 1);

        return $left.str_repeat(' ', $spaces).$right;
    }

    private function center(string $text, int $width): string
    {
        return mb_strimwidth($text, 0, $width, '');
    }
}
