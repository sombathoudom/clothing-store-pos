<?php

namespace App\Http\Requests\Settings;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class BusinessSettingsUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('manage business settings') ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'invoice_prefix' => ['required', 'string', 'max:20'],
            'invoice_next_number' => ['required', 'integer', 'min:1'],
            'invoice_number_padding' => ['required', 'integer', 'min:4', 'max:10'],
            'riel_exchange_rate' => ['required', 'integer', 'min:1'],
            'low_stock_threshold' => ['required', 'integer', 'min:0'],
            'store_name' => ['required', 'string', 'max:255'],
            'store_phone' => ['nullable', 'string', 'max:255'],
            'receipt_footer' => ['nullable', 'string', 'max:500'],
            'printer_ip' => ['nullable', 'ip'],
            'printer_port' => ['required', 'integer', 'min:1', 'max:65535'],
        ];
    }
}
