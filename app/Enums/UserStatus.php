<?php

namespace App\Enums;

use App\Concerns\HasOptions;

enum UserStatus: string
{
    use HasOptions;

    case Active = 'active';
    case Suspended = 'suspended';

    /**
     * Get the human-readable label for the case.
     */
    public function label(): string
    {
        return match ($this) {
            self::Active => 'Active',
            self::Suspended => 'Suspended',
        };
    }
}
