<?php

namespace App\Support;

use App\Enums\SettingKey;
use App\Models\Setting;

class InvoiceNumberGenerator
{
    public function __construct(private BusinessSettings $businessSettings) {}

    public function next(): string
    {
        $settings = $this->businessSettings->defaults();

        $rows = Setting::query()
            ->whereIn('key', [
                SettingKey::InvoicePrefix->value,
                SettingKey::InvoiceNextNumber->value,
                SettingKey::InvoiceNumberPadding->value,
            ])
            ->lockForUpdate()
            ->get()
            ->pluck('value', 'key');

        $prefix = $rows->get(SettingKey::InvoicePrefix->value, $settings[SettingKey::InvoicePrefix->value]);
        $nextNumber = (int) $rows->get(SettingKey::InvoiceNextNumber->value, $settings[SettingKey::InvoiceNextNumber->value]);
        $padding = (int) $rows->get(SettingKey::InvoiceNumberPadding->value, $settings[SettingKey::InvoiceNumberPadding->value]);

        Setting::updateOrCreate(
            ['key' => SettingKey::InvoiceNextNumber->value],
            ['value' => (string) ($nextNumber + 1)],
        );

        return sprintf('%s-%s', $prefix, str_pad((string) $nextNumber, $padding, '0', STR_PAD_LEFT));
    }
}
