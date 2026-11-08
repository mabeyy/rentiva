<?php

namespace App\Notifications;

use App\Actions\Integrations\OwnerMailer;
use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class BookingChanged extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * @param  string  $before  The car and dates before the change.
     */
    public function __construct(public Booking $booking, public string $before)
    {
        $this->afterCommit();
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        // Booking emails are a plan feature.
        return $this->booking->car->owner->planIncludes('email') ? ['mail'] : [];
    }

    /**
     * Tell the renter what changed about their booking.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $storefront = $this->booking->car->owner->storefront;

        return app(OwnerMailer::class)->apply(new MailMessage, $storefront)
            ->subject(__('Your booking :reference was updated', ['reference' => $this->booking->reference]))
            ->greeting(__('Hi :name,', ['name' => $this->booking->renter_name]))
            ->line(__(':business updated your booking.', ['business' => $storefront->name ?? $this->booking->car->owner->name]))
            ->line(__('Now: :car, :period. Total :total.', [
                'car' => $this->booking->car->name,
                'period' => $this->booking->period(),
                'total' => $this->booking->formattedTotal(),
            ]))
            ->line(__('Before: :before.', ['before' => $this->before]))
            ->action(__('View booking'), $this->booking->manageUrl());
    }
}
