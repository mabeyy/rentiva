<?php

namespace App\Actions\Integrations;

use App\Models\BookingEvent;
use App\Notifications\BookingActivity;

/**
 * What a booking event triggers: an in-app alert for the owner, a text to
 * whoever needs to act next, and keeping the owner's Google Calendar in step.
 */
class NotifyBookingEvent
{
    /** Events that change what the owner's calendar should show. */
    private const array CALENDAR_ACTIONS = ['added', 'changed', 'confirmed', 'declined', 'cancelled', 'completed', 'payment_approved'];

    public function __construct(
        private readonly SendSms $sendSms,
        private readonly SyncBookingToCalendar $syncCalendar,
    ) {}

    public function handle(BookingEvent $event): void
    {
        $booking = $event->booking->loadMissing('car.owner.storefront');

        if (BookingActivity::shouldAlert($event)) {
            $booking->car->owner->notify(new BookingActivity($event));
        }

        $storefront = $booking->car->owner->storefront;

        if (! $storefront) {
            return;
        }

        [$recipient, $message] = $this->sms($event) ?? [null, null];

        if ($recipient && $message) {
            $this->sendSms->handle($storefront, $recipient, $message, $booking);
        }

        if (in_array($event->action, self::CALENDAR_ACTIONS, true)) {
            $this->syncCalendar->handle($booking);
        }
    }

    /**
     * The phone number and text for an event, or null when nobody needs one.
     *
     * @return array{0: string, 1: string}|null
     */
    private function sms(BookingEvent $event): ?array
    {
        $booking = $event->booking;
        $storefront = $booking->car->owner->storefront;
        $ownerPhone = (string) $storefront?->phone;
        $trip = "{$booking->car->name}, {$booking->period()}";
        $owner = (string) $storefront?->name;

        return match ($event->action) {
            'requested' => [$ownerPhone, "New booking request {$booking->reference} from {$booking->renter_name}: {$trip}. Reply in your Rentiva dashboard."],
            'confirmed' => [$booking->renter_phone, "{$owner}: your booking {$booking->reference} ({$trip}) is confirmed.".($booking->payment_due_at ? " Please send your bank transfer by {$booking->payment_due_at->format('M j, g:i A')}." : '')],
            'declined' => [$booking->renter_phone, "{$owner}: sorry, your booking request {$booking->reference} ({$trip}) was declined."],
            'cancelled' => $event->actor_type === 'renter'
                ? [$ownerPhone, "Booking {$booking->reference} ({$trip}) was cancelled by {$booking->renter_name}."]
                : [$booking->renter_phone, "{$owner}: your booking {$booking->reference} ({$trip}) was cancelled."],
            'payment_submitted' => [$ownerPhone, "{$booking->renter_name} sent a bank transfer for {$booking->reference}. Check it in your Rentiva dashboard."],
            'payment_approved' => [$booking->renter_phone, "{$owner}: we received your payment for {$booking->reference}. See you at pickup!"],
            'payment_rejected' => [$booking->renter_phone, "{$owner}: we couldn't confirm your transfer for {$booking->reference}. Please check your booking link and send it again."],
            default => null,
        };
    }
}
