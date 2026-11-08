<?php

namespace App\Http\Controllers\Lessor;

use App\Http\Controllers\Controller;
use App\Models\PickupLocation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class MainPickupLocationController extends Controller
{
    /**
     * Make a pickup location the storefront's main one, which sets its city.
     */
    public function __invoke(Request $request, PickupLocation $pickupLocation): RedirectResponse
    {
        Gate::authorize('update', $pickupLocation);

        $storefront = $request->user()->storefront;
        abort_unless($storefront, 404);

        $storefront->update([
            'main_pickup_location_id' => $pickupLocation->id,
            'city' => $pickupLocation->city,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Main location updated.')]);

        return to_route('lessor.pickup-locations.index');
    }
}
