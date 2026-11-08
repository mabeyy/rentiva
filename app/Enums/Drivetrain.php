<?php

namespace App\Enums;

use App\Concerns\HasOptions;

enum Drivetrain: string
{
    use HasOptions;

    case Fwd = 'fwd';
    case Rwd = 'rwd';
    case Awd = 'awd';
    case FourWheelDrive = '4wd';

    /**
     * Get the human-readable label for the case.
     */
    public function label(): string
    {
        return match ($this) {
            self::Fwd => 'FWD',
            self::Rwd => 'RWD',
            self::Awd => 'AWD',
            self::FourWheelDrive => '4WD',
        };
    }
}
