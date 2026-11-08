<?php

namespace App\Console\Commands;

use App\Actions\Bookings\ChangeBookingStatus;
use App\Enums\BookingStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Models\Booking;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('bookings:release-unpaid')]
#[Description('Cancel confirmed bank transfer bookings whose payment deadline passed without a transfer, freeing the dates.')]
class ReleaseUnpaidTransfers extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(ChangeBookingStatus $changeBookingStatus): int
    {
        $released = 0;

        Booking::query()
            ->where('status', BookingStatus::Confirmed)
            ->where('payment_method', PaymentMethod::BankTransfer)
            ->whereIn('payment_status', [PaymentStatus::Unpaid, PaymentStatus::Rejected])
            ->where('payment_due_at', '<=', now())
            ->with('car.owner')
            ->each(function (Booking $booking) use ($changeBookingStatus, &$released): void {
                $changeBookingStatus->handle(
                    $booking,
                    BookingStatus::Cancelled,
                    __('Not paid by the transfer deadline.'),
                    bySystem: true,
                );
                $released++;
            });

        $this->info("Released {$released} unpaid ".str('booking')->plural($released).'.');

        return self::SUCCESS;
    }
}
