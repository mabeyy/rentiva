<?php

namespace App\Console\Commands;

use App\Actions\Integrations\SendSms;
use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Notifications\PickupReminder;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Notification;

#[Signature('bookings:send-reminders')]
#[Description('Email and text renters 24 hours and 2 hours before pickup, as each owner has switched on.')]
class SendPickupReminders extends Command
{
    /**
     * Execute the console command. Each reminder goes out once, inside its
     * window: 24h from a day to two hours before pickup, 2h in the last two
     * hours. A booking confirmed late only gets the window it falls in.
     */
    public function handle(SendSms $sendSms): int
    {
        $sent = 0;

        Booking::query()
            ->where('status', BookingStatus::Confirmed)
            ->whereDate('start_date', '>=', now(Booking::PICKUP_TIMEZONE)->toDateString())
            ->whereDate('start_date', '<=', now(Booking::PICKUP_TIMEZONE)->addDays(2)->toDateString())
            ->where(fn ($query) => $query->whereNull('reminder_24h_sent_at')->orWhereNull('reminder_2h_sent_at'))
            ->with('car.owner.storefront', 'car.pickupLocation')
            ->each(function (Booking $booking) use ($sendSms, &$sent): void {
                $hoursLeft = now()->diffInMinutes($booking->pickupAt(), false) / 60;

                $window = match (true) {
                    $hoursLeft <= 0 => null,
                    $hoursLeft <= 2 && $booking->reminder_2h_sent_at === null => 2,
                    $hoursLeft > 2 && $hoursLeft <= 24 && $booking->reminder_24h_sent_at === null => 24,
                    default => null,
                };

                if ($window === null) {
                    return;
                }

                $this->remind($booking, $window, $sendSms);
                $sent++;
            });

        $this->info("Sent {$sent} pickup ".str('reminder')->plural($sent).'.');

        return self::SUCCESS;
    }

    private function remind(Booking $booking, int $hoursBefore, SendSms $sendSms): void
    {
        $storefront = $booking->car->owner->storefront;

        if ($booking->renter_email && $storefront?->{"remind_email_{$hoursBefore}h"}) {
            Notification::route('mail', [$booking->renter_email => $booking->renter_name])
                ->notify(new PickupReminder($booking, $hoursBefore));
        }

        if ($storefront?->{"remind_sms_{$hoursBefore}h"}) {
            $when = $hoursBefore === 24 ? 'tomorrow' : 'in 2 hours';
            $sendSms->handle(
                $storefront,
                $booking->renter_phone,
                "{$storefront->name}: reminder, you pick up the {$booking->car->name} {$when} at {$booking->pickupAt()->format('g:i A')}. Booking {$booking->reference}.",
                $booking,
            );
        }

        $booking->forceFill([
            "reminder_{$hoursBefore}h_sent_at" => now(),
            // The 2-hour window closes the 24-hour one, so it never goes out late.
            ...($hoursBefore === 2 ? ['reminder_24h_sent_at' => $booking->reminder_24h_sent_at ?? now()] : []),
        ])->save();
    }
}
