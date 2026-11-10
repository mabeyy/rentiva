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

    /** Skip quietly if the booking, car or invoice was deleted before it sent. */
    public bool $deleteWhenMissingModels = true;

    public function __construct(public Booking $booking, public string $reason) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        // The renter needs this to act on their booking, so it goes out on every plan.
        return ['mail'];
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
