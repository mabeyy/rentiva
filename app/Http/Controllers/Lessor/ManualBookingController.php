<?php

namespace App\Http\Controllers\Lessor;

use App\Actions\Bookings\CreateBooking;
use App\Enums\BookingSource;
use App\Enums\PaymentMethod;
use App\Http\Controllers\Controller;
use App\Http\Requests\Lessor\StoreManualBookingRequest;
use App\Models\Car;
use App\Models\PeakSeason;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ManualBookingController extends Controller
{
    /**
     * The form for a booking the owner took by phone, chat or in person.
     */
    public function create(Request $request): Response
    {
        $cars = $request->user()->cars()->oldest('make')->oldest('model')->get();

        return Inertia::render('lessor/bookings/create', [
            'cars' => $cars->map(fn (Car $car): array => [
                'slug' => $car->slug,
                'name' => $car->name,
                ...$car->only(['daily_rate', 'security_deposit', 'weekly_discount', 'monthly_discount', 'delivery_fee', 'driver_daily_rate']),
                'booked_ranges' => $car->upcomingBookedRanges(),
            ]),
            'initialCar' => $request->query('car'),
            'seasons' => ! $request->user()->planIncludes('peak_pricing') ? [] : $request->user()->peakSeasons()->upcoming()->get()->map(fn (PeakSeason $season): array => PeakSeasonController::present($season)),
            'sources' => BookingSource::manualOptions(),
            'paymentMethods' => PaymentMethod::options(),
            'hasStorefront' => $request->user()->storefront !== null,
        ]);
    }

    /**
     * Save the booking, confirmed straight away.
     */
    public function store(StoreManualBookingRequest $request, CreateBooking $createBooking): RedirectResponse
    {
        $booking = $createBooking->handle(
            $request->car(),
            $request->safe()->except(['car', 'license_photo']),
            $request->file('license_photo'),
            addedByOwner: true,
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Booking :reference added.', ['reference' => $booking->reference])]);

        return to_route('lessor.bookings.show', $booking);
    }
}
