<?php

namespace App\Http\Controllers\Lessor;

use App\Actions\Bookings\ChangeBooking;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Notifications\ChangeRequestAnswered;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;

class BookingChangeRequestController extends Controller
{
    /**
     * Move the booking to the dates the renter asked for, keeping the same
     * car and extras. The renter gets the usual "booking updated" email.
     */
    public function approve(Booking $booking, ChangeBooking $changeBooking): RedirectResponse
    {
        Gate::authorize('update', $booking);
        $request = $booking->change_request;
        abort_if($request === null, 404);

        $changeBooking->handle(
            $booking,
            $booking->car,
            CarbonImmutable::parse($request['start_date']),
            CarbonImmutable::parse($request['end_date']),
            withDelivery: $booking->delivery_address !== null,
            deliveryAddress: $booking->delivery_address,
            withDriver: $booking->with_driver,
            reason: __('Renter asked'),
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Dates changed. The renter has been emailed.')]);

        return back();
    }

    /**
     * Say no, with a reason the renter sees.
     */
    public function decline(Request $request, Booking $booking): RedirectResponse
    {
        Gate::authorize('update', $booking);
        abort_if($booking->change_request === null, 404);

        $reason = $request->validate(['reason' => ['required', 'string', 'max:300']])['reason'];
        $booking->forceFill(['change_request' => null])->save();
        $booking->recordEvent('change_declined', $reason);

        if ($booking->renter_email) {
            Notification::route('mail', [$booking->renter_email => $booking->renter_name])->notify(new ChangeRequestAnswered($booking, $reason));
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Request declined. The renter has been emailed.')]);

        return back();
    }
}
