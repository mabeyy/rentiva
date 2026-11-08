<?php

namespace App\Enums;

use App\Concerns\HasOptions;

/**
 * Where a booking came from: the booking page, or the owner adding one they
 * took by phone, chat or in person.
 */
enum BookingSource: string
{
    use HasOptions;

    case Online = 'online';
    case Phone = 'phone';
    case Messenger = 'messenger';
    case WalkIn = 'walk_in';
    case Other = 'other';

    /**
     * Get the human-readable label for the case.
     */
    public function label(): string
    {
        return match ($this) {
            self::Online => 'Booking page',
            self::Phone => 'Phone call',
            self::Messenger => 'Messenger or chat',
            self::WalkIn => 'Walk-in',
            self::Other => 'Other',
        };
    }

    /**
     * The sources an owner can pick when adding a booking themselves.
     *
     * @return array<int, array{value: string, label: string}>
     */
    public static function manualOptions(): array
    {
        return array_values(array_map(
            fn (self $source): array => $source->toOption(),
            array_filter(self::cases(), fn (self $source): bool => $source !== self::Online),
        ));
    }
}
