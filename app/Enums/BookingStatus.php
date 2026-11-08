<?php

namespace App\Enums;

use App\Concerns\HasOptions;

enum BookingStatus: string
{
    use HasOptions;

    case Pending = 'pending';
    case Confirmed = 'confirmed';
    case Declined = 'declined';
    case Cancelled = 'cancelled';
    case Completed = 'completed';

    /**
     * Get the human-readable label for the case.
     */
    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pending',
            self::Confirmed => 'Confirmed',
            self::Declined => 'Declined',
            self::Cancelled => 'Cancelled',
            self::Completed => 'Completed',
        };
    }

    /**
     * Get the statuses that reserve a car's dates.
     *
     * @return array<int, self>
     */
    public static function reserving(): array
    {
        return [self::Pending, self::Confirmed];
    }

    /**
     * Get the statuses a booking in this status may move to.
     *
     * @return array<int, self>
     */
    public function nextStatuses(): array
    {
        return match ($this) {
            self::Pending => [self::Confirmed, self::Declined, self::Cancelled],
            self::Confirmed => [self::Completed, self::Cancelled],
            self::Declined, self::Cancelled, self::Completed => [],
        };
    }

    /**
     * Determine whether a booking in this status may move to the given status.
     */
    public function canTransitionTo(self $status): bool
    {
        return in_array($status, $this->nextStatuses(), true);
    }
}
