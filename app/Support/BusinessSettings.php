<?php

namespace App\Support;

use App\Enums\SettingKey;
use App\Models\Setting;

class BusinessSettings
{
    /**
     * @return array<string, string>
     */
    public function all(): array
    {
        return array_merge(
            $this->defaults(),
            Setting::query()
                ->whereIn('key', SettingKey::values())
                ->pluck('value', 'key')
                ->all(),
        );
    }

    public function get(SettingKey $key): string
    {
        return $this->all()[$key->value];
    }

    /**
     * @param  array<string, scalar|null>  $values
     */
    public function put(array $values): void
    {
        foreach ($values as $key => $value) {
            if (! in_array($key, SettingKey::values(), true) || $value === null) {
                continue;
            }

            Setting::updateOrCreate(
                ['key' => $key],
                ['value' => (string) $value],
            );
        }
    }

    public function invoicePreview(): string
    {
        $settings = $this->all();

        return sprintf(
            '%s-%s',
            $settings[SettingKey::InvoicePrefix->value],
            str_pad(
                $settings[SettingKey::InvoiceNextNumber->value],
                (int) $settings[SettingKey::InvoiceNumberPadding->value],
                '0',
                STR_PAD_LEFT,
            ),
        );
    }

    /**
     * @return array<string, string>
     */
    public function defaults(): array
    {
        return [
            SettingKey::InvoicePrefix->value => 'INV',
            SettingKey::InvoiceNextNumber->value => '1',
            SettingKey::InvoiceNumberPadding->value => '6',
            SettingKey::RielExchangeRate->value => '4100',
            SettingKey::LowStockThreshold->value => '5',
            SettingKey::StoreName->value => config('app.name', 'Clothing POS'),
            SettingKey::StorePhone->value => '',
            SettingKey::ReceiptFooter->value => 'Thank you for shopping with us.',
            SettingKey::PrinterIp->value => '',
            SettingKey::PrinterPort->value => '9100',
        ];
    }
}
