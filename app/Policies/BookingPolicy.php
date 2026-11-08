<?php

namespace App\Policies;

use App\Models\Booking;
use App\Models\User;

class BookingPolicy
{
    /**
     * Determine whether the user can act on the booking as the car's owner.
     */
    public function update(User $user, Booking $booking): bool
    {
        return $booking->car->owner()->is($user);
    }
}
