<?php

namespace Database\Factories;

use App\Models\ProductVariant;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PurchaseItem>
 */
class PurchaseItemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $quantity = fake()->numberBetween(1, 30);

        return [
            'purchase_id' => Purchase::factory(),
            'product_variant_id' => ProductVariant::factory(),
            'qty' => $quantity,
            'remaining_qty' => $quantity,
            'cost_price' => fake()->randomFloat(4, 1, 20),
            'suggested_sell_price' => fake()->optional()->randomFloat(4, 5, 35),
        ];
    }
}
