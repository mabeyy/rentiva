<?php

namespace App\Enums;

use App\Concerns\HasOptions;

enum UserRole: string
{
    use HasOptions;

    case Admin = 'admin';
    case Lessor = 'lessor';
    case Staff = 'staff';

    /**
     * Get the human-readable label for the case.
     */
    public function label(): string
    {
        return match ($this) {
            self::Admin => 'Admin',
            self::Lessor => 'Lessor',
            self::Staff => 'Staff',
        };
    }
}
