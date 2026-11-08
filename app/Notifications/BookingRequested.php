<?php

namespace App\Notifications;

use App\Models\Booking;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class BookingRequested extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(public Booking $booking)
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
     * Tell the lessor a renter is waiting for their approval.
     */
    public function toMail(User $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject(__('New booking request :reference', ['reference' => $this->booking->reference]))
            ->greeting(__('Hi :name,', ['name' => $notifiable->name]))
            ->line(__(':renter wants to rent your :car for :period.', [
                'renter' => $this->booking->renter_name,
                'car' => $this->booking->car->name,
                'period' => $this->booking->period(),
            ]))
            ->line($this->booking->down_payment > 0
                ? __('Total :total: a :down down payment by bank transfer once confirmed, the rest at pickup.', ['total' => $this->booking->formattedTotal(), 'down' => $this->booking->formattedTransferAmount()])
                : __('Total: :total (:method).', ['total' => $this->booking->formattedTotal(), 'method' => $this->booking->payment_method->label()]))
            ->action(__('Review request'), route('lessor.bookings.index'));
    }
}
