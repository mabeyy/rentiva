<?php

namespace App\Http\Controllers\Lessor;

use App\Http\Controllers\Controller;
use App\Http\Requests\Lessor\SavePickupLocationRequest;
use App\Http\Resources\PickupLocationResource;
use App\Models\PickupLocation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PickupLocationController extends Controller
{
    /**
     * List the lessor's pickup locations with how many cars use each.
     */
    public function index(Request $request): Response
    {
        return Inertia::render('lessor/pickup-locations', [
            'pickupLocations' => PickupLocationResource::collection(
                $request->user()->pickupLocations()->withCount('cars')->orderBy('city')->orderBy('address')->get(),
            ),
            'mainPickupLocationId' => $request->user()->storefront?->main_pickup_location_id,
        ]);
    }

    /**
     * Add a pickup location.
     */
    public function store(SavePickupLocationRequest $request): RedirectResponse
    {
        if (! $request->user()->planIncludes('multiple_locations') && $request->user()->pickupLocations()->exists()) {
            throw ValidationException::withMessages(['address' => __('Your plan includes one pickup location. More locations are on the Fleet plan.')]);
        }

        $request->user()->pickupLocations()->create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Pickup location added.')]);

        return to_route('lessor.pickup-locations.index');
    }

    /**
     * Update a pickup location; its cars follow automatically.
     */
    public function update(SavePickupLocationRequest $request, PickupLocation $pickupLocation): RedirectResponse
    {
        $pickupLocation->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Pickup location saved.')]);

        return to_route('lessor.pickup-locations.index');
    }

    /**
     * Remove a pickup location that no car uses.
     */
    public function destroy(PickupLocation $pickupLocation): RedirectResponse
    {
        Gate::authorize('delete', $pickupLocation);

        $pickupLocation->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Pickup location removed.')]);

        return to_route('lessor.pickup-locations.index');
    }
}
