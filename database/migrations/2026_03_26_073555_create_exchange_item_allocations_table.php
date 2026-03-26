<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('exchange_item_allocations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exchange_item_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sale_item_allocation_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('purchase_item_id')->constrained()->restrictOnDelete();
            $table->string('allocation_role', 20);
            $table->unsignedInteger('qty');
            $table->decimal('unit_cost', 12, 4);
            $table->decimal('total_cost', 12, 2);
            $table->timestamps();

            $table->index(['exchange_item_id', 'purchase_item_id']);
            $table->index(['sale_item_allocation_id', 'allocation_role']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exchange_item_allocations');
    }
};
