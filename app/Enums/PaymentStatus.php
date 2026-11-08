<?php

namespace App\Enums;

use App\Concerns\HasOptions;

/**
 * Where a bank transfer stands. Pay-at-pickup bookings stay unpaid here; the
 * owner collects the money in person.
 */
enum PaymentStatus: string
{
    use HasOptions;

    case Unpaid = 'unpaid';
    case Submitted = 'submitted';
    case Paid = 'paid';
    case Rejected = 'rejected';

    /**
     * Get the human-readable label for the case.
     */
    public function label(): string
    {
        return match ($this) {
            self::Unpaid => 'Awaiting payment',
            self::Submitted => 'Payment to check',
            self::Paid => 'Paid',
            self::Rejected => 'Payment rejected',
        };
    }
}
