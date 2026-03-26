<?php

namespace Database\Factories;

use App\Models\PurchaseItem;
use App\Models\SaleItem;
use App\Models\SaleItemAllocation;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SaleItemAllocation>
 */
class SaleItemAllocationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $quantity = fake()->numberBetween(1, 3);
        $unitCost = fake()->randomFloat(4, 1, 20);

        return [
            'sale_item_id' => SaleItem::factory(),
            'purchase_item_id' => PurchaseItem::factory(),
            'qty' => $quantity,
            'unit_cost' => $unitCost,
            'total_cost' => round($quantity * $unitCost, 2),
        ];
    }
}
