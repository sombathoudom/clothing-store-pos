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
        Schema::create('purchases', function (Blueprint $table) {
            $table->id();
            $table->string('reference_no')->nullable();
            $table->string('supplier_name')->nullable();
            $table->dateTime('purchased_at');
            $table->text('note')->nullable();
            $table->timestamps();

            $table->index('reference_no');
            $table->index('supplier_name');
            $table->index('purchased_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchases');
    }
};
