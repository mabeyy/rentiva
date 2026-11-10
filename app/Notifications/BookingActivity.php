<?php

namespace App\Notifications;

use App\Models\BookingEvent;
use Carbon\CarbonImmutable;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * An in-app alert for the owner when a renter (or the system) does something
 * on one of their bookings: a new request, a transfer to check, a
 * cancellation or a review.
 */
class BookingActivity extends Notification
{
    use Queueable;

    /** Events worth an alert, when a renter or the system caused them. */
    public const array ACTIONS = ['requested', 'cancelled', 'declined', 'payment_submitted', 'reviewed', 'change_requested'];

    public function __construct(public BookingEvent $event) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Whether an event should alert the owner.
     */
    public static function shouldAlert(BookingEvent $event): bool
    {
        return $event->booking_id !== null
            && in_array($event->action, self::ACTIONS, true)
            && in_array($event->actor_type, ['renter', 'system'], true);
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array{action: string, title: string, body: string, reference: string, url: string}
     */
    public function toArray(object $notifiable): array
    {
        $booking = $this->event->booking;
        $trip = "{$booking->car->name} · {$booking->period()}";

        [$title, $body] = match ($this->event->action) {
            'requested' => [__('New booking request'), "{$booking->renter_name} · {$trip}"],
            'cancelled' => $this->event->actor_type === 'system'
                ? [__('Booking released, no transfer received'), "{$booking->renter_name} · {$trip}"]
                : [__(':renter cancelled', ['renter' => $booking->renter_name]), $trip],
            'declined' => [__('Request expired'), __(':renter · :trip. It wasn\'t answered within 48 hours or before pickup.', ['renter' => $booking->renter_name, 'trip' => $trip])],
            'payment_submitted' => [__('Transfer to check'), __(':renter sent :total', ['renter' => $booking->renter_name, 'total' => $booking->formattedTransferAmount()])],
            'change_requested' => [__(':renter asked to change dates', ['renter' => $booking->renter_name]), __('Wants :start – :end', [
                'start' => CarbonImmutable::parse($booking->change_request['start_date'] ?? $booking->start_date)->format('M j'),
                'end' => CarbonImmutable::parse($booking->change_request['end_date'] ?? $booking->end_date)->format('M j'),
            ])],
            'reviewed' => [__('New :rating-star review', ['rating' => $booking->review->rating ?? '']), "{$booking->renter_name} · {$booking->car->name}"],
            default => [$this->event->action, $trip],
        };

        return [
            'action' => $this->event->action,
            'title' => $title,
            'body' => $body,
            'reference' => $booking->reference,
            // Open the page this alert's staff permission covers.
            'url' => match ($this->event->action) {
                'payment_submitted' => route('lessor.transfers', absolute: false),
                'reviewed' => route('lessor.reviews.index', absolute: false),
                default => route('lessor.bookings.show', $booking, absolute: false),
            },
        ];
    }
}
