<?php

namespace App\Policies;

use App\Models\PickupLocation;
use App\Models\User;

class PickupLocationPolicy
{
    /**
     * Determine whether the user can add a pickup location.
     */
    public function create(User $user): bool
    {
        return ! $user->isSuspended();
    }

    /**
     * Determine whether the user can edit the pickup location.
     */
    public function update(User $user, PickupLocation $pickupLocation): bool
    {
        return $pickupLocation->owner()->is($user) && ! $user->isSuspended();
    }

    /**
     * Determine whether the user can remove the pickup location. Locations a
     * car still uses, or the storefront's main one, must be replaced first.
     */
    public function delete(User $user, PickupLocation $pickupLocation): bool
    {
        return $this->update($user, $pickupLocation)
            && ! $pickupLocation->cars()->exists()
            && ! $pickupLocation->isMain();
    }
}
