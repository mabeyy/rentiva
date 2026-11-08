<?php

namespace App\Enums;

use App\Concerns\HasOptions;

enum FuelType: string
{
    use HasOptions;

    case Gasoline = 'gasoline';
    case Diesel = 'diesel';
    case Hybrid = 'hybrid';
    case Electric = 'electric';

    /**
     * Get the human-readable label for the case.
     */
    public function label(): string
    {
        return match ($this) {
            self::Gasoline => 'Gasoline',
            self::Diesel => 'Diesel',
            self::Hybrid => 'Hybrid',
            self::Electric => 'Electric',
        };
    }
}
