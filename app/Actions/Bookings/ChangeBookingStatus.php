<?php

namespace App\Actions\Bookings;

use App\Enums\BookingStatus;
use App\Enums\PaymentMethod;
use App\Models\Booking;
use App\Notifications\BookingStatusChanged;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\ValidationException;

class ChangeBookingStatus
{
    /**
     * Move a booking to a new status and let the renter know (unless
     * `notifyRenter` is off, for old trips closed in bulk).
     *
     * @throws ValidationException
     */
    public function handle(Booking $booking, BookingStatus $status, ?string $reason = null, bool $bySystem = false, bool $notifyRenter = true): Booking
    {
        if (! $booking->status->canTransitionTo($status)) {
            throw ValidationException::withMessages([
                'status' => __('A :from booking cannot be marked as :to.', [
                    'from' => strtolower($booking->status->label()),
                    'to' => strtolower($status->label()),
                ]),
            ]);
        }

        if ($status === BookingStatus::Completed && $booking->start_date->isFuture()) {
            throw ValidationException::withMessages([
                'status' => __('A trip can only be marked completed once it has started.'),
            ]);
        }

        $booking->forceFill([
            'status' => $status,
            ...match ($status) {
                BookingStatus::Confirmed => ['confirmed_at' => now()],
                BookingStatus::Declined => ['declined_at' => now(), 'decline_reason' => $reason],
                BookingStatus::Cancelled => ['cancelled_at' => now(), 'cancel_reason' => $reason],
                default => [],
            },
            // A finished booking can't have its dates moved any more.
            ...(in_array($status, [BookingStatus::Declined, BookingStatus::Cancelled, BookingStatus::Completed], true)
                ? ['change_request' => null]
                : []),
        ])->save();

        if ($status === BookingStatus::Confirmed && $booking->payment_method === PaymentMethod::BankTransfer) {
            $booking->startTransferDeadline();
        }

        $booking->recordEvent($status->value, in_array($status, [BookingStatus::Declined, BookingStatus::Cancelled], true) ? $reason : null, $bySystem);

        if ($notifyRenter && $booking->renter_email) {
            Notification::route('mail', [$booking->renter_email => $booking->renter_name])
                ->notify(new BookingStatusChanged($booking));
        }

        return $booking;
    }
}
