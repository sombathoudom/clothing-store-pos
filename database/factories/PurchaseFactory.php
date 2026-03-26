<?php

namespace Database\Factories;

use App\Models\Purchase;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Purchase>
 */
class PurchaseFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'reference_no' => fake()->boolean(70) ? fake()->unique()->bothify('PO-######') : null,
            'supplier_name' => fake()->boolean(70) ? fake()->company() : null,
            'purchased_at' => fake()->dateTimeBetween('-1 month'),
            'note' => fake()->boolean(50) ? fake()->sentence() : null,
        ];
    }
}
