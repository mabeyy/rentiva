<?php

namespace App\Http\Controllers\Public;

use App\Actions\Bookings\CheckBookingRules;
use App\Enums\BookingStatus;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class BookingChangeRequestController extends Controller
{
    /**
     * A renter asks the owner to move their dates. Nothing changes until the
     * owner approves.
     */
    public function store(Request $request, Booking $booking): RedirectResponse
    {
        abort_unless(in_array($booking->status, [BookingStatus::Pending, BookingStatus::Confirmed], true) && $booking->change_request === null, 403);

        // Keeping the same pickup (e.g. only returning later on a trip under
        // way) is always fine; a new pickup date must be one renters can book.
        $keepsPickup = $request->input('start_date') === $booking->start_date->toDateString();

        $data = $request->validate([
            'start_date' => ['required', 'date_format:Y-m-d', ...($keepsPickup ? [] : ['after_or_equal:today'])],
            'end_date' => ['required', 'date_format:Y-m-d', 'after:start_date', 'after_or_equal:today', 'before_or_equal:start_date +30 days'],
            'note' => ['nullable', 'string', 'max:300'],
        ]);

        // Only ask for dates the owner could actually say yes to.
        $startDate = CarbonImmutable::parse($data['start_date']);
        $endDate = CarbonImmutable::parse($data['end_date']);
        $car = $booking->car;
        $problem = $car->owner->storefront ? app(CheckBookingRules::class)->firstProblem($car->owner->storefront, $startDate, $endDate, checkPickup: ! $keepsPickup) : null;

        if ($problem) {
            throw ValidationException::withMessages([$problem[0] => $problem[1]]);
        }

        if (! $car->isAvailableBetween($startDate, $endDate, except: $booking) || $car->isBlockedBetween($startDate, $endDate)) {
            throw ValidationException::withMessages(['start_date' => __('The car isn\'t free for some of those dates. Try others.')]);
        }

        $booking->forceFill(['change_request' => [...$data, 'note' => $data['note'] ?? null, 'requested_at' => now()->toIso8601String()]])->save();
        $booking->recordEvent('change_requested', $data['note'] ?? null);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Request sent. The owner will reply by email.')]);

        return back();
    }

    /**
     * The renter takes back their request before the owner answers.
     */
    public function destroy(Booking $booking): RedirectResponse
    {
        abort_if($booking->change_request === null, 404);

        $booking->forceFill(['change_request' => null])->save();
        $booking->recordEvent('change_withdrawn');

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Request withdrawn. Your booking keeps its dates.')]);

        return back();
    }
}
