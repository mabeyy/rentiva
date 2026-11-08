<?php

namespace App\Notifications;

use App\Actions\Integrations\OwnerMailer;
use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Tells the renter the owner couldn't move their dates, and why.
 */
class ChangeRequestAnswered extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Booking $booking, public string $reason) {}

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

    public function toMail(object $notifiable): MailMessage
    {
        return app(OwnerMailer::class)->apply(new MailMessage, $this->booking->car->owner->storefront)
            ->subject(__('About your change request for :reference', ['reference' => $this->booking->reference]))
            ->greeting(__('Hi :name,', ['name' => $this->booking->renter_name]))
            ->line(__('The owner couldn\'t move your booking. It stays :car, :period.', ['car' => $this->booking->car->name, 'period' => $this->booking->period()]))
            ->line(__('Their reason: :reason', ['reason' => $this->reason]))
            ->action(__('View booking'), $this->booking->manageUrl());
    }
}
