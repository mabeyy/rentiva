<?php

namespace App\Console\Commands;

use App\Actions\Bookings\ChangeBookingStatus;
use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Notifications\ReviewReminder;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Notification;

#[Signature('bookings:complete-finished')]
#[Description('Mark confirmed trips completed a couple of days after the return date, and remind renters who haven\'t reviewed yet.')]
class CompleteFinishedBookings extends Command
{
    /** Days after the return date before a trip the owner didn't close is completed. */
    public const int COMPLETE_AFTER_DAYS = 2;

    /** Trips that ended longer ago than this are completed without asking for a review. */
    public const int ASK_FOR_REVIEW_WITHIN_DAYS = 14;

    /** Days after the return date to remind a renter who hasn't left a review. */
    public const int REVIEW_REMINDER_AFTER_DAYS = 7;

    /**
     * Execute the console command. Runs once a day, so each reminder date
     * matches once.
     */
    public function handle(ChangeBookingStatus $changeBookingStatus): int
    {
        $completed = 0;

        Booking::query()
            ->where('status', BookingStatus::Confirmed)
            ->whereDate('end_date', '<=', today()->subDays(self::COMPLETE_AFTER_DAYS))
            ->each(function (Booking $booking) use ($changeBookingStatus, &$completed): void {
                // Old trips get closed quietly; a "how was it?" weeks later would confuse.
                $isRecent = $booking->end_date->greaterThanOrEqualTo(today()->subDays(self::ASK_FOR_REVIEW_WITHIN_DAYS));
                $changeBookingStatus->handle($booking, BookingStatus::Completed, bySystem: true, notifyRenter: $isRecent);
                $completed++;
            });

        $reminded = 0;

        Booking::query()
            ->where('status', BookingStatus::Completed)
            ->whereNotNull('renter_email')
            ->whereDoesntHave('review')
            ->whereDate('end_date', today()->subDays(self::REVIEW_REMINDER_AFTER_DAYS))
            ->each(function (Booking $booking) use (&$reminded): void {
                Notification::route('mail', [$booking->renter_email => $booking->renter_name])
                    ->notify(new ReviewReminder($booking));
                $reminded++;
            });

        $this->info("Completed {$completed} ".str('booking')->plural($completed).", sent {$reminded} review ".str('reminder')->plural($reminded).'.');

        return self::SUCCESS;
    }
}
