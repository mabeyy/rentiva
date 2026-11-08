<?php

namespace App\Enums;

use App\Concerns\HasOptions;

enum Transmission: string
{
    use HasOptions;

    case Automatic = 'automatic';
    case Manual = 'manual';
    case Cvt = 'cvt';

    /**
     * Get the human-readable label for the case.
     */
    public function label(): string
    {
        return match ($this) {
            self::Automatic => 'Automatic',
            self::Manual => 'Manual',
            self::Cvt => 'CVT',
        };
    }
}
