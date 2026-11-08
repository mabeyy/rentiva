<?php

namespace App\Policies;

use App\Models\Car;
use App\Models\User;

class CarPolicy
{
    /**
     * Determine whether the user can list a new car.
     */
    public function create(User $user): bool
    {
        return ! $user->isSuspended();
    }

    /**
     * Determine whether the user can edit the car.
     */
    public function update(User $user, Car $car): bool
    {
        return $car->owner()->is($user) && ! $user->isSuspended();
    }

    /**
     * Determine whether the user can submit the car for admin review.
     */
    public function submit(User $user, Car $car): bool
    {
        return $this->update($user, $car) && $car->status->isSubmittable();
    }

    /**
     * Determine whether the user can switch the listing between active and inactive.
     */
    public function toggleActivation(User $user, Car $car): bool
    {
        return $this->update($user, $car) && $car->status->isToggleable();
    }

    /**
     * Determine whether the user can delete the car.
     */
    public function delete(User $user, Car $car): bool
    {
        return $car->owner()->is($user) && ! $car->bookings()->reserving()->exists();
    }
}
