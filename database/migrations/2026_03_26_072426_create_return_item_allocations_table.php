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
        Schema::create('return_item_allocations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('return_item_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sale_item_allocation_id')->constrained()->restrictOnDelete();
            $table->foreignId('purchase_item_id')->constrained()->restrictOnDelete();
            $table->unsignedInteger('qty');
            $table->timestamps();

            $table->index(['return_item_id', 'sale_item_allocation_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('return_item_allocations');
    }
};
