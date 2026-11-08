<?php

namespace App\Http\Controllers\Lessor;

use App\Http\Controllers\Controller;
use App\Http\Requests\Lessor\UpdateStorefrontRequest;
use App\Http\Resources\PickupLocationResource;
use App\Http\Resources\StorefrontResource;
use App\Models\Storefront;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class StorefrontController extends Controller
{
    /**
     * Show the form for customizing the lessor's booking page.
     */
    public function edit(Request $request): Response
    {
        $storefront = $request->user()->storefront;

        return Inertia::render('lessor/storefront', [
            'storefront' => $storefront ? StorefrontResource::make($storefront) : null,
            'pickupLocations' => PickupLocationResource::collection(
                $request->user()->pickupLocations()->orderBy('city')->orderBy('address')->get(),
            ),
            'suggestedSlug' => $storefront ? null : Storefront::uniqueSlugFor($request->user()->name),
        ]);
    }

    /**
     * Create or update the lessor's booking page.
     */
    public function update(UpdateStorefrontRequest $request): RedirectResponse
    {
        $storefront = $request->user()->storefront ?? $request->user()->storefront()->make();
        $storefront->fill($request->safe()->except('logo'));
        $storefront->main_pickup_location_id ??= $request->user()->pickupLocations()->value('id');
        $storefront->city = $storefront->mainPickupLocation()->value('city') ?? $storefront->city;

        if ($request->hasFile('logo')) {
            if ($storefront->logo_path) {
                Storage::disk('public')->delete($storefront->logo_path);
            }

            $path = $request->file('logo')->store('storefronts', 'public');

            if ($path === false) {
                throw new RuntimeException('The logo could not be stored.');
            }

            $storefront->logo_path = $path;
        }

        $storefront->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Booking page saved.')]);

        return to_route('lessor.storefront.edit');
    }
}
