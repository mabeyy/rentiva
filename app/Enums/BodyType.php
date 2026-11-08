<?php

namespace App\Enums;

use App\Concerns\HasOptions;

enum BodyType: string
{
    use HasOptions;

    case Sedan = 'sedan';
    case Hatchback = 'hatchback';
    case Suv = 'suv';
    case Crossover = 'crossover';
    case Mpv = 'mpv';
    case Van = 'van';
    case Pickup = 'pickup';
    case Coupe = 'coupe';
    case Convertible = 'convertible';
    case Scooter = 'scooter';
    case Motorcycle = 'motorcycle';

    /**
     * Get the human-readable label for the case.
     */
    public function label(): string
    {
        return match ($this) {
            self::Sedan => 'Sedan',
            self::Hatchback => 'Hatchback',
            self::Suv => 'SUV',
            self::Crossover => 'Crossover',
            self::Mpv => 'MPV',
            self::Van => 'Van',
            self::Pickup => 'Pickup',
            self::Coupe => 'Coupe',
            self::Convertible => 'Convertible',
            self::Scooter => 'Scooter',
            self::Motorcycle => 'Motorcycle',
        };
    }

    /**
     * Whether this is a two-wheeler, which has riders instead of doors and no drivetrain choice.
     */
    public function isTwoWheeler(): bool
    {
        return in_array($this, [self::Scooter, self::Motorcycle], true);
    }
}
