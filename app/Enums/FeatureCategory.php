<?php

namespace App\Enums;

use App\Concerns\HasOptions;

/**
 * How car features are grouped on the car form and the car's public page,
 * in display order.
 */
enum FeatureCategory: string
{
    use HasOptions;

    case Comfort = 'comfort';
    case Safety = 'safety';
    case Tech = 'tech';
    case Convenience = 'convenience';

    /**
     * Get the human-readable label for the case.
     */
    public function label(): string
    {
        return match ($this) {
            self::Comfort => 'Comfort',
            self::Safety => 'Safety',
            self::Tech => 'Tech',
            self::Convenience => 'Convenience',
        };
    }
}
