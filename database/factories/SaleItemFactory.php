<?php

namespace Database\Factories;

use App\Models\ProductVariant;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SaleItem>
 */
class SaleItemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $quantity = fake()->numberBetween(1, 5);
        $sellPrice = fake()->randomFloat(4, 5, 40);
        $subtotal = round($quantity * $sellPrice, 2);
        $costTotal = fake()->randomFloat(2, 1, $subtotal);

        return [
            'sale_id' => Sale::factory(),
            'product_variant_id' => ProductVariant::factory(),
            'qty' => $quantity,
            'sell_price' => $sellPrice,
            'subtotal' => $subtotal,
            'cost_total' => $costTotal,
            'profit_total' => round($subtotal - $costTotal, 2),
        ];
    }
}
