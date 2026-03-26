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
        Schema::create('exchange_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained()->cascadeOnDelete();
            $table->string('reference_no')->unique();
            $table->decimal('difference_total', 12, 2)->default(0);
            $table->text('note')->nullable();
            $table->dateTime('exchanged_at')->index();
            $table->timestamps();

            $table->index(['sale_id', 'exchanged_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exchange_records');
    }
};
