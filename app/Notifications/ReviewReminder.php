<?php

namespace App\Notifications;

use App\Actions\Integrations\OwnerMailer;
use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * One gentle reminder to a renter who hasn't rated their finished trip.
 */
class ReviewReminder extends Notification implements ShouldQueue
{
    use Queueable;

    /** Skip quietly if the booking, car or invoice was deleted before it sent. */
    public bool $deleteWhenMissingModels = true;

    public function __construct(public Booking $booking) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $business = $this->booking->car->owner->storefront->name ?? $this->booking->car->owner->name;

        return app(OwnerMailer::class)->apply(new MailMessage, $this->booking->car->owner->storefront)
            ->subject(__('A minute to rate your :car?', ['car' => $this->booking->car->name]))
            ->greeting(__('Hi :name,', ['name' => $this->booking->renter_name]))
            ->line(__('You rented the :car from :business (:period). How did it go?', [
                'car' => $this->booking->car->name,
                'business' => $business,
                'period' => $this->booking->period(),
            ]))
            ->line(__('A quick rating helps :business and the next renter. We won\'t ask again.', ['business' => $business]))
            ->action(__('Rate your trip'), $this->booking->manageUrl().'#review');
    }
}
