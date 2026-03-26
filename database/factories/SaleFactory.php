<?php

namespace Database\Factories;

use App\Enums\SaleStatus;
use App\Models\Sale;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Sale>
 */
class SaleFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $totalAmount = fake()->randomFloat(2, 10, 300);
        $discount = fake()->randomFloat(2, 0, 10);

        return [
            'invoice_no' => fake()->unique()->bothify('INV-######'),
            'customer_name' => fake()->optional()->name(),
            'customer_phone' => fake()->optional()->phoneNumber(),
            'customer_address' => fake()->optional()->address(),
            'status' => SaleStatus::Completed,
            'total_amount' => $totalAmount,
            'discount' => $discount,
            'final_amount' => max($totalAmount - $discount, 0),
            'riel_exchange_rate' => 4100,
            'sold_at' => fake()->dateTimeBetween('-1 week'),
        ];
    }
}
