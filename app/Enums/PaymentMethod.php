<?php

namespace App\Enums;

use App\Concerns\HasOptions;

enum PaymentMethod: string
{
    use HasOptions;

    case PayAtPickup = 'pickup';
    case BankTransfer = 'bank_transfer';

    /**
     * Get the human-readable label for the case.
     */
    public function label(): string
    {
        return match ($this) {
            self::PayAtPickup => 'Pay at pickup',
            self::BankTransfer => 'Bank transfer',
        };
    }
}
