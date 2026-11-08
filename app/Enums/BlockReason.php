<?php

namespace App\Enums;

use App\Concerns\HasOptions;

enum BlockReason: string
{
    use HasOptions;

    case Maintenance = 'maintenance';
    case PersonalUse = 'personal_use';
    case Other = 'other';

    /**
     * Get the human-readable label for the case.
     */
    public function label(): string
    {
        return match ($this) {
            self::Maintenance => 'Maintenance',
            self::PersonalUse => 'Personal use',
            self::Other => 'Other',
        };
    }
}
