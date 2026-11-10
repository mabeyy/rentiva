<?php

namespace App\Http\Controllers\Lessor;

use App\Actions\Bookings\ChangeBooking;
use App\Enums\BookingStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Public\StoreBookingRequest;
use App\Models\Booking;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class BookingChangeController extends Controller
{
    /**
     * Move, extend or shorten a booking, or switch it to another car. The
     * price is worked out again; extra charges already added are kept.
     */
    public function update(Request $request, Booking $booking, ChangeBooking $changeBooking): RedirectResponse
    {
        Gate::authorize('update', $booking);
        abort_unless(in_array($booking->status, [BookingStatus::Pending, BookingStatus::Confirmed], true), 403);

        $data = $request->validate([
            'car' => ['required', 'string', Rule::exists('cars', 'slug')->where('owner_id', $booking->car->owner_id)],
            'start_date' => ['required', 'date_format:Y-m-d'],
            'end_date' => ['required', 'date_format:Y-m-d', 'after:start_date'],
            'with_delivery' => ['boolean'],
            'delivery_address' => ['exclude_unless:with_delivery,true', 'required', 'string', 'max:255'],
            'with_driver' => ['boolean'],
            'ignore_rules' => ['boolean'],
        ], [
            'delivery_address.required' => __('Add where to deliver the car.'),
        ]);

        $car = $booking->car->owner->cars()->where('slug', $data['car'])->firstOrFail();
        $startDate = CarbonImmutable::parse($data['start_date']);
        $endDate = CarbonImmutable::parse($data['end_date']);

        if ($startDate->diffInDays($endDate) > StoreBookingRequest::MAX_DAYS * 3) {
            throw ValidationException::withMessages(['end_date' => __('That booking is too long.')]);
        }

        if (! $request->boolean('ignore_rules')) {
            $this->checkBookingRules($booking, $startDate, $endDate);
        }

        $changeBooking->handle(
            $booking,
            $car,
            $startDate,
            $endDate,
            withDelivery: (bool) ($data['with_delivery'] ?? false),
            deliveryAddress: $data['delivery_address'] ?? null,
            withDriver: (bool) ($data['with_driver'] ?? false),
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Booking updated.')]);

        return back();
    }

    /**
     * The owner's own booking rules apply to changes too, unless they choose
     * to allow it anyway. Notice only matters when the pickup day moves.
     *
     * @throws ValidationException
     */
    private function checkBookingRules(Booking $booking, CarbonImmutable $startDate, CarbonImmutable $endDate): void
    {
        $storefront = $booking->car->owner->storefront;

        if (! $storefront) {
            return;
        }

        $days = (int) $startDate->diffInDays($endDate);
        $pickupAt = CarbonImmutable::parse("{$startDate->toDateString()} {$storefront->pickup_time}", Booking::PICKUP_TIMEZONE);
        $movesPickup = ! $startDate->isSameDay($booking->start_date);

        $message = match (true) {
            $days < $storefront->min_rental_days => trans_choice('Your shortest rental is :count day.|Your shortest rental is :count days.', $storefront->min_rental_days),
            $movesPickup && $storefront->advance_notice_hours > 0 && $pickupAt->lt(now()->addHours($storefront->advance_notice_hours)) => trans_choice('That pickup is less than :count hour away.|That pickup is less than :count hours away.', $storefront->advance_notice_hours),
            $movesPickup && $startDate->gt(today()->addDays($storefront->max_advance_days)) => __('That\'s more than :days days ahead.', ['days' => $storefront->max_advance_days]),
            default => null,
        };

        if (is_string($message)) {
            throw ValidationException::withMessages(['ignore_rules' => __(':rule Tick "Allow anyway" to save it.', ['rule' => $message])]);
        }
    }
}
