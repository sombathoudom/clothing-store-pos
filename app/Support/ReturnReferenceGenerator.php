<?php

namespace App\Support;

use App\Models\ReturnRecord;

class ReturnReferenceGenerator
{
    public function next(): string
    {
        $nextId = (int) (ReturnRecord::query()->max('id') ?? 0) + 1;

        return sprintf('RET-%06d', $nextId);
    }
}
