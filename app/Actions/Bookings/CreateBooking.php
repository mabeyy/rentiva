<?php

namespace App\Actions\Bookings;

use App\Enums\BookingStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Models\Booking;
use App\Models\Car;
use App\Notifications\BookingReceived;
use App\Notifications\BookingRequested;
use App\Notifications\BookingStatusChanged;
use Carbon\CarbonImmutable;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\ValidationException;

class CreateBooking
{
    public function __construct(private readonly PriceBooking $priceBooking) {}

    /**
     * Reserve a car and notify whoever needs to know. A renter's request waits
     * for the owner; a booking the owner adds (taken by phone, chat or in
     * person) is confirmed straight away.
     *
     * @param  array<string, mixed>  $details  Validated renter details, `start_date` / `end_date`, and the optional
     *                                         `with_delivery`, `delivery_address`, `with_driver`, `source` and `is_paid`.
     *
     * @throws ValidationException
     */
    public function handle(Car $car, array $details, ?UploadedFile $licensePhoto = null, bool $addedByOwner = false): Booking
    {
        $startDate = CarbonImmutable::parse((string) $details['start_date']);
        $endDate = CarbonImmutable::parse((string) $details['end_date']);
        $withDelivery = (bool) ($details['with_delivery'] ?? false);
        $isPaid = (bool) ($details['is_paid'] ?? false);

        $booking = DB::transaction(function () use ($car, $details, $startDate, $endDate, $withDelivery, $isPaid, $licensePhoto, $addedByOwner): Booking {
            // Lock the car row so two renters cannot reserve the same dates concurrently.
            $car = Car::query()->lockForUpdate()->findOrFail($car->id);

            if (! $addedByOwner && ! $car->isListed()) {
                throw ValidationException::withMessages(['start_date' => __('This car is no longer available for booking.')]);
            }

            if (! $addedByOwner && $car->owner->isBillingPaused()) {
                throw ValidationException::withMessages(['start_date' => __('This business isn\'t taking online bookings right now. Please contact them directly.')]);
            }

            if (! $car->isAvailableBetween($startDate, $endDate)) {
                throw ValidationException::withMessages(['start_date' => __('This car is already booked for some of those dates.')]);
            }

            if ($car->isBlockedBetween($startDate, $endDate)) {
                throw ValidationException::withMessages(['start_date' => __('This car is not available for some of those dates.')]);
            }

            $booking = $car->bookings()->make([
                ...Arr::except($details, ['with_delivery', 'is_paid', 'license_photo']),
                ...$this->priceBooking->handle($car, $startDate, $endDate, $withDelivery, (bool) ($details['with_driver'] ?? false)),
                'delivery_address' => $withDelivery && $car->delivery_fee !== null ? ($details['delivery_address'] ?? null) : null,
                'with_driver' => (bool) ($details['with_driver'] ?? false) && $car->driver_daily_rate !== null,
                ...($addedByOwner ? ['status' => BookingStatus::Confirmed, 'confirmed_at' => now()] : ['source' => 'online']),
            ]);

            if ($addedByOwner && $isPaid) {
                $booking->forceFill(['payment_status' => PaymentStatus::Paid, 'paid_at' => now()]);
            }

            $storefront = $car->owner->storefront;

            if ($booking->payment_method === PaymentMethod::BankTransfer && $storefront?->down_payment_enabled && $car->owner->planIncludes('down_payments')) {
                $booking->down_payment = self::downPayment($booking->total, $storefront->down_payment_percent);
            }

            if ($licensePhoto) {
                $booking->forceFill(['license_photo_path' => $licensePhoto->store('license-photos', 'local')]);
            }

            $booking->save();

            return $booking;
        });

        if ($addedByOwner) {
            $booking->recordEvent('added', $booking->source->label());

            if ($booking->renter_email) {
                Notification::route('mail', [$booking->renter_email => $booking->renter_name])
                    ->notify(new BookingStatusChanged($booking));
            }

            return $booking;
        }

        $booking->recordEvent('requested', $booking->payment_method->label());
        $booking->car->owner->notify(new BookingRequested($booking));
        Notification::route('mail', [$booking->renter_email => $booking->renter_name])
            ->notify(new BookingReceived($booking));

        return $booking;
    }

    /**
     * The down payment for a total, rounded to the nearest peso.
     */
    public static function downPayment(int $total, int $percent): int
    {
        return (int) round($total * $percent / 10000) * 100;
    }
}
