<?php

namespace App\Actions\Bookings;

use App\Models\Booking;
use App\Models\Storefront;
use Carbon\CarbonImmutable;

/**
 * The owner's booking rules for a pickup and return date: shortest rental,
 * notice before pickup (and never a pickup time that has already passed),
 * and how far ahead renters can book. Used for new requests and for a
 * renter asking to move their dates.
 */
class CheckBookingRules
{
    /**
     * The first rule broken, as [field, message], or null when the dates are
     * fine. `checkPickup` off skips the pickup-time rules, for a booking that
     * keeps the pickup it already has.
     *
     * @return array{0: string, 1: string}|null
     */
    public function firstProblem(Storefront $storefront, CarbonImmutable $startDate, CarbonImmutable $endDate, bool $checkPickup = true): ?array
    {
        $days = (int) $startDate->diffInDays($endDate);
        $pickupAt = CarbonImmutable::parse("{$startDate->toDateString()} {$storefront->pickup_time}", Booking::PICKUP_TIMEZONE);

        return match (true) {
            $checkPickup && $pickupAt->isPast() => ['start_date', __('Today\'s pickup time has passed. Pick tomorrow or later.')],
            $days < $storefront->min_rental_days => ['end_date', trans_choice('Book at least :count day.|Book at least :count days.', $storefront->min_rental_days)],
            $checkPickup && $storefront->advance_notice_hours > 0 && $pickupAt->lt(now()->addHours($storefront->advance_notice_hours)) => ['start_date', trans_choice('Book at least :count hour before pickup.|Book at least :count hours before pickup.', $storefront->advance_notice_hours)],
            $checkPickup && $startDate->gt(today()->addDays($storefront->max_advance_days)) => ['start_date', __('Bookings open :days days ahead.', ['days' => $storefront->max_advance_days])],
            default => null,
        };
    }
}
