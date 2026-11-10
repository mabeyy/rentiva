<?php

namespace App\Console\Commands;

use App\Actions\Bookings\ChangeBookingStatus;
use App\Enums\BookingStatus;
use App\Models\Booking;
use Carbon\CarbonImmutable;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('bookings:expire-pending')]
#[Description('Decline booking requests the owner didn\'t answer within 48 hours, or before the pickup time, so the dates open up again.')]
class ExpirePendingRequests extends Command
{
    /** Hours an owner has to answer a request. */
    public const int ANSWER_WITHIN_HOURS = 48;

    /**
     * Execute the console command.
     */
    public function handle(ChangeBookingStatus $changeBookingStatus): int
    {
        $expired = 0;

        Booking::query()
            ->where('status', BookingStatus::Pending)
            ->where(fn ($query) => $query
                ->where('created_at', '<=', now()->subHours(self::ANSWER_WITHIN_HOURS))
                ->orWhereDate('start_date', '<=', today()))
            ->with('car.owner.storefront')
            ->lazyById()
            ->each(function (Booking $booking) use ($changeBookingStatus, &$expired): void {
                $pickupTime = $booking->car->owner->storefront->pickup_time ?? '09:00';
                $pickupAt = CarbonImmutable::parse("{$booking->start_date->toDateString()} {$pickupTime}", Booking::PICKUP_TIMEZONE);
                $isStale = $booking->created_at->lte(now()->subHours(self::ANSWER_WITHIN_HOURS));

                if (! $isStale && $pickupAt->isFuture()) {
                    return;
                }

                $changeBookingStatus->handle(
                    $booking,
                    BookingStatus::Declined,
                    __('The owner didn\'t answer in time, so the request expired. You can send a new one.'),
                    bySystem: true,
                );
                $expired++;
            });

        $this->info("Expired {$expired} ".str('request')->plural($expired).'.');

        return self::SUCCESS;
    }
}
