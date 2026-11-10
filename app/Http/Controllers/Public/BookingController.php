<?php

namespace App\Http\Controllers\Public;

use App\Actions\Bookings\ChangeBookingStatus;
use App\Actions\Bookings\CreateBooking;
use App\Enums\BookingStatus;
use App\Enums\PaymentMethod;
use App\Http\Controllers\Controller;
use App\Http\Requests\Public\StoreBookingRequest;
use App\Http\Resources\BookingResource;
use App\Http\Resources\PaymentAccountResource;
use App\Http\Resources\StorefrontResource;
use App\Models\Booking;
use App\Models\Car;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\URL;
use Inertia\Inertia;
use Inertia\Response;

class BookingController extends Controller
{
    /**
     * Request a booking as a guest renter.
     */
    public function store(StoreBookingRequest $request, Car $car, CreateBooking $createBooking): RedirectResponse
    {
        $booking = $createBooking->handle($car, $request->safe()->except(['accepted_terms', 'license_photo']), $request->file('license_photo'));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Booking request sent. Check your email for the details.')]);

        return redirect()->to($booking->manageUrl());
    }

    /**
     * Show a booking to the guest who holds its signed link, in the owner's branding.
     */
    public function show(Booking $booking): Response
    {
        $booking->load(['car.coverImage', 'car.owner.storefront.pickupLocations', 'review']);
        $owner = $booking->car->owner;
        $storefront = $owner->storefront;
        $canRequestChange = in_array($booking->status, [BookingStatus::Pending, BookingStatus::Confirmed], true) && $booking->change_request === null;

        return Inertia::render($storefront ? 'storefront/booking' : 'bookings/show', [
            'storefront' => $storefront ? StorefrontResource::make($storefront) : null,
            'booking' => BookingResource::make($booking),
            // Renters can always reach the owner: while waiting, during the trip,
            // and after it ends or is cancelled (e.g. about a refund).
            'host' => ['name' => $storefront->name ?? $owner->name, 'email' => $storefront->notification_email ?? $owner->email, 'phone' => $storefront->phone ?? $owner->phone],
            'cancelUrl' => $booking->renterCancellationBlockedReason() === null
                ? URL::signedRoute('bookings.destroy', $booking)
                : null,
            // Why there's no Cancel button on a booking that is still active.
            'cancellationNote' => $booking->status->canTransitionTo(BookingStatus::Cancelled)
                ? $booking->renterCancellationBlockedReason()
                : null,
            'payment' => $this->paymentDetails($booking),
            'changeRequestUrl' => $canRequestChange
                ? URL::signedRoute('bookings.change-request.store', $booking)
                : null,
            // What the date picker needs to offer only dates the owner could accept.
            'changeRequestCalendar' => $canRequestChange && $storefront ? [
                'booked_ranges' => $booking->car->upcomingBookedRanges(except: $booking),
                'rules' => [
                    'min_days' => $storefront->min_rental_days,
                    'notice_hours' => $storefront->advance_notice_hours,
                    'max_advance_days' => $storefront->max_advance_days,
                    'pickup_time' => $storefront->pickup_time,
                ],
            ] : null,
            'withdrawChangeRequestUrl' => $booking->change_request !== null
                ? URL::signedRoute('bookings.change-request.destroy', $booking)
                : null,
            'review' => $booking->review?->only(['rating', 'comment', 'owner_reply']),
            'reviewUrl' => $booking->isReviewable()
                ? URL::signedRoute('bookings.review.store', $booking)
                : null,
        ]);
    }

    /**
     * Cancel the booking on the guest's behalf.
     */
    public function destroy(Booking $booking, ChangeBookingStatus $changeBookingStatus): RedirectResponse
    {
        // The owner's policy blocks an otherwise cancellable booking; finished
        // ones fall through to the status check, which explains why.
        abort_if(
            $booking->status->canTransitionTo(BookingStatus::Cancelled) && $booking->renterCancellationBlockedReason() !== null,
            403,
            (string) $booking->renterCancellationBlockedReason(),
        );

        if (! $booking->status->canTransitionTo(BookingStatus::Cancelled)) {
            Inertia::flash('toast', ['type' => 'info', 'message' => __('This booking is already :status.', ['status' => strtolower($booking->status->label())])]);

            return redirect()->to($booking->manageUrl());
        }

        $changeBookingStatus->handle($booking, BookingStatus::Cancelled, __('Cancelled by the renter.'));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Your booking was cancelled.')]);

        return redirect()->to($booking->manageUrl());
    }

    /**
     * Where to send a bank transfer and the signed URL to submit it, once the
     * owner has confirmed a bank-transfer booking.
     *
     * @return array<string, mixed>|null
     */
    private function paymentDetails(Booking $booking): ?array
    {
        $storefront = $booking->car->owner->storefront;

        if ($booking->payment_method !== PaymentMethod::BankTransfer || ! $storefront) {
            return null;
        }

        return [
            'accounts' => PaymentAccountResource::collection($storefront->paymentAccounts)->resolve(),
            'submit_url' => $booking->awaitsTransfer() ? URL::signedRoute('bookings.payment.store', $booking) : null,
        ];
    }
}
