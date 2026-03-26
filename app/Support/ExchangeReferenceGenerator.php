<?php

namespace App\Support;

use App\Models\ExchangeRecord;

class ExchangeReferenceGenerator
{
    public function next(): string
    {
        $nextId = (int) (ExchangeRecord::query()->max('id') ?? 0) + 1;

        return sprintf('EXC-%06d', $nextId);
    }
}
