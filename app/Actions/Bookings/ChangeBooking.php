<?php

namespace App\Actions\Bookings;

use App\Enums\PaymentStatus;
use App\Models\Booking;
use App\Models\Car;
use App\Notifications\BookingChanged;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\ValidationException;

/**
 * Moves a booking to new dates (or another car), prices it again keeping any
 * extra charges, logs it, and emails the renter what changed.
 */
class ChangeBooking
{
    public function __construct(private readonly PriceBooking $priceBooking) {}

    /**
     * @throws ValidationException
     */
    public function handle(
        Booking $booking,
        Car $car,
        CarbonImmutable $startDate,
        CarbonImmutable $endDate,
        bool $withDelivery,
        ?string $deliveryAddress,
        bool $withDriver,
        ?string $reason = null,
    ): void {
        $before = "{$booking->car->name}, {$booking->period()}";

        DB::transaction(function () use ($booking, $car, $startDate, $endDate, $withDelivery, $deliveryAddress, $withDriver): void {
            if (! $car->isAvailableBetween($startDate, $endDate, except: $booking)) {
                throw ValidationException::withMessages(['start_date' => __('The car is already booked for some of those dates.')]);
            }

            if ($car->isBlockedBetween($startDate, $endDate)) {
                throw ValidationException::withMessages(['start_date' => __('Some of those dates are blocked for this car.')]);
            }

            $withDelivery = $withDelivery && $car->delivery_fee !== null;
            $price = $this->priceBooking->handle($car, $startDate, $endDate, $withDelivery, $withDriver);

            $booking->car()->associate($car);
            $booking->fill([
                'start_date' => $startDate,
                'end_date' => $endDate,
                ...collect($price)->except('total')->all(),
                'with_driver' => $withDriver && $car->driver_daily_rate !== null,
                'delivery_address' => $withDelivery ? $deliveryAddress : null,
            ]);
            $booking->change_request = null;
            $booking->recalculateTotal();

            if ($booking->down_payment > 0 && $booking->payment_status !== PaymentStatus::Paid) {
                $booking->down_payment = CreateBooking::downPayment($booking->total, $car->owner->storefront->down_payment_percent ?? 30);
            }

            $booking->save();
        });

        $booking->recordEvent('changed', collect([__('Was :before', ['before' => $before]), $reason])->filter()->implode(' · '));

        if ($booking->renter_email) {
            Notification::route('mail', [$booking->renter_email => $booking->renter_name])
                ->notify(new BookingChanged($booking->fresh(), $before));
        }
    }
}
