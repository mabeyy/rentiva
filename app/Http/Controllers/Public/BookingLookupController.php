<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Requests\Public\LookupBookingRequest;
use App\Http\Resources\StorefrontResource;
use App\Models\Booking;
use App\Models\Storefront;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class BookingLookupController extends Controller
{
    /**
     * Show the form guests use to find their booking, branded when reached
     * from an owner's booking page.
     */
    public function create(?Storefront $storefront = null): Response
    {
        if ($storefront) {
            abort_unless($storefront->isOpen(), 404);

            return Inertia::render('storefront/lookup', ['storefront' => StorefrontResource::make($storefront->load('pickupLocations'))]);
        }

        return Inertia::render('bookings/lookup');
    }

    /**
     * Send the guest to their booking when the reference and email match.
     */
    public function store(LookupBookingRequest $request): RedirectResponse
    {
        $booking = Booking::query()
            ->where('reference', Str::upper(trim($request->validated('reference'))))
            ->where('renter_email', $request->validated('email'))
            ->first();

        if (! $booking) {
            return back()->withErrors(['reference' => __('We could not find a booking with that reference and email.')]);
        }

        return redirect()->to($booking->manageUrl());
    }
}
