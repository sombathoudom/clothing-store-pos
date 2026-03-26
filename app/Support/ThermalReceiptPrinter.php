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

        $lines = [
            "\x1B@",
            "\x1Ba\x01",
            $this->center($storeName),
            $storePhone !== '' ? $this->center($storePhone) : '',
            $this->center('RECEIPT'),
            "\x1Ba\x00",
            str_repeat('-', 42),
            $this->line('Invoice', $sale->invoice_no),
            $this->line('Date', $sale->sold_at?->format('Y-m-d H:i') ?? ''),
            $this->line('Customer', $sale->customer_name ?? 'Walk-in'),
            str_repeat('-', 42),
        ];

        foreach ($sale->items as $item) {
            $lines[] = $item->productVariant->product->name.' / '.$item->productVariant->size->value;
            $lines[] = $this->line(
                sprintf('%sx %s', $item->qty, number_format((float) $item->sell_price, 2)),
                number_format((float) $item->subtotal, 2),
            );
        }

        $lines = array_merge($lines, [
            str_repeat('-', 42),
            $this->line('Subtotal', number_format((float) $sale->total_amount, 2)),
            $this->line('Discount', number_format((float) $sale->discount, 2)),
            $this->line('Total', number_format((float) $sale->final_amount, 2)),
            $this->line(
                'KHR',
                number_format((float) $sale->final_amount * (float) $sale->riel_exchange_rate, 0),
            ),
            str_repeat('-', 42),
            "\x1Ba\x01",
            $this->center($receiptFooter),
            "\x1Ba\x00",
            "\n\n\n",
            "\x1DV\x00",
        ]);

        return implode("\n", array_filter($lines, fn ($line) => $line !== ''));
    }

    private function line(string $left, string $right): string
    {
        $width = 42;
        $left = mb_strimwidth($left, 0, 26, '');
        $right = mb_strimwidth($right, 0, 14, '');
        $spaces = max($width - mb_strwidth($left) - mb_strwidth($right), 1);

        return $left.str_repeat(' ', $spaces).$right;
    }

    private function center(string $text): string
    {
        return mb_strimwidth($text, 0, 42, '');
    }
}
