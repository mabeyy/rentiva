<?php

namespace App\Actions\Integrations;

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Models\Booking;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Mirrors a booking on its owner's Google Calendar: an all-day event across
 * the rental while it's confirmed, removed when it's declined or cancelled.
 */
class SyncBookingToCalendar
{
    public function __construct(private readonly GoogleCalendarClient $calendar) {}

    public function handle(Booking $booking): void
    {
        $storefront = $booking->car->owner->storefront;

        if (! $storefront?->google_calendar_enabled || blank($storefront->google_private_key) || blank($storefront->google_calendar_id) || ! $storefront->owner->planIncludes('calendar_sync')) {
            return;
        }

        try {
            $shouldShow = in_array($booking->status, [BookingStatus::Confirmed, BookingStatus::Completed], true);

            if (! $shouldShow) {
                if ($booking->google_event_id) {
                    $this->calendar->delete($storefront, $booking->google_event_id);
                    $booking->forceFill(['google_event_id' => null])->save();
                }

                return;
            }

            $event = $this->event($booking);

            if ($booking->google_event_id) {
                $this->calendar->update($storefront, $booking->google_event_id, $event);
            } else {
                $booking->forceFill(['google_event_id' => $this->calendar->create($storefront, $event)])->save();
            }
        } catch (Throwable $exception) {
            Log::warning('Google Calendar sync failed', ['booking' => $booking->reference, 'error' => $exception->getMessage()]);
        }
    }

    /**
     * An all-day event from pickup to return (Google's end date is exclusive).
     *
     * @return array<string, mixed>
     */
    private function event(Booking $booking): array
    {
        $paid = $booking->payment_status === PaymentStatus::Paid ? ' · Paid' : '';

        return [
            'summary' => "{$booking->car->name} · {$booking->renter_name}{$paid}",
            'description' => implode("\n", array_filter([
                "Booking {$booking->reference}",
                "Renter: {$booking->renter_name} · {$booking->renter_phone} · {$booking->renter_email}",
                "Total: {$booking->formattedTotal()} ({$booking->payment_method->label()})",
                $booking->car->pickupLocation ? "Pickup: {$booking->car->pickupLocation->address}, {$booking->car->pickupLocation->city}" : null,
                $booking->notes ? "Note: {$booking->notes}" : null,
            ])),
            'start' => ['date' => $booking->start_date->toDateString()],
            'end' => ['date' => $booking->end_date->addDay()->toDateString()],
        ];
    }
}
