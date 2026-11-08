<?php

namespace App\Enums;

use App\Concerns\HasOptions;

/**
 * Whether renters may cancel a confirmed booking themselves from its link.
 */
enum RenterCancellation: string
{
    use HasOptions;

    case Anytime = 'anytime';
    case WithNotice = 'notice';
    case Never = 'never';

    /**
     * Get the human-readable label for the case.
     */
    public function label(): string
    {
        return match ($this) {
            self::Anytime => 'Yes, any time before pickup',
            self::WithNotice => 'Yes, but not close to pickup',
            self::Never => 'No, they have to contact me',
        };
    }
}
