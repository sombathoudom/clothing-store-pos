<?php

namespace App\Http\Requests;

use App\Enums\StockAdjustmentReason;
use App\Enums\StockAdjustmentType;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStockAdjustmentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('manage adjustments') ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'product_variant_id' => ['required', 'integer', Rule::exists('product_variants', 'id')],
            'type' => ['required', Rule::in(StockAdjustmentType::values())],
            'reason' => ['required', Rule::in(StockAdjustmentReason::values())],
            'qty' => ['required', 'integer', 'min:1'],
            'note' => ['nullable', 'string'],
            'performed_at' => ['required', 'date'],
        ];
    }
}
