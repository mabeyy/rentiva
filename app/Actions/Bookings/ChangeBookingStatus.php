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
     * Move a booking to a new status and let the renter know.
     *
     * @throws ValidationException
     */
    public function handle(Booking $booking, BookingStatus $status, ?string $reason = null, bool $bySystem = false): Booking
    {
        if (! $booking->status->canTransitionTo($status)) {
            throw ValidationException::withMessages([
                'status' => __('A :from booking cannot be marked as :to.', [
                    'from' => strtolower($booking->status->label()),
                    'to' => strtolower($status->label()),
                ]),
            ]);
        }

        $booking->update([
            'status' => $status,
            ...match ($status) {
                BookingStatus::Confirmed => ['confirmed_at' => now()],
                BookingStatus::Declined => ['declined_at' => now(), 'decline_reason' => $reason],
                BookingStatus::Cancelled => ['cancelled_at' => now()],
                default => [],
            },
        ]);

        if ($status === BookingStatus::Confirmed && $booking->payment_method === PaymentMethod::BankTransfer) {
            $booking->startTransferDeadline();
        }

        $booking->recordEvent($status->value, in_array($status, [BookingStatus::Declined, BookingStatus::Cancelled], true) ? $reason : null, $bySystem);

        if ($booking->renter_email) {
            Notification::route('mail', [$booking->renter_email => $booking->renter_name])
                ->notify(new BookingStatusChanged($booking));
        }

        return $booking;
    }
}
