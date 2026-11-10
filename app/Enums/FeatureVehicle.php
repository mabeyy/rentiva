<?php

namespace App\Enums;

use App\Concerns\HasOptions;

/**
 * Which vehicles a feature can be offered on.
 */
enum FeatureVehicle: string
{
    use HasOptions;

    case Cars = 'cars';
    case TwoWheelers = 'two_wheelers';
    case All = 'all';

    /**
     * Get the human-readable label for the case.
     */
    public function label(): string
    {
        return match ($this) {
            self::Cars => 'Cars',
            self::TwoWheelers => 'Motorcycles & scooters',
            self::All => 'All vehicles',
        };
    }
}
