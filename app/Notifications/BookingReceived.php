<?php

namespace App\Notifications;

use App\Actions\Integrations\OwnerMailer;
use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class BookingReceived extends Notification implements ShouldQueue
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
        // Essential for the renter (their booking link and its outcome), so
        // sent on every plan.
        return ['mail'];
    }

    /**
     * Confirm to the guest renter that their request was received.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return app(OwnerMailer::class)->apply(new MailMessage, $this->booking->car->owner->storefront)
            ->subject(__('Booking request :reference received', ['reference' => $this->booking->reference]))
            ->greeting(__('Hi :name,', ['name' => $this->booking->renter_name]))
            ->line(__('We sent your request for the :car (:period) to the owner. You will get an email once they respond.', [
                'car' => $this->booking->car->name,
                'period' => $this->booking->period(),
            ]))
            ->line($this->booking->down_payment > 0
                ? __('Total :total: a :down down payment by bank transfer once confirmed, the rest at pickup.', ['total' => $this->booking->formattedTotal(), 'down' => $this->booking->formattedTransferAmount()])
                : __('Total: :total (:method).', ['total' => $this->booking->formattedTotal(), 'method' => $this->booking->payment_method->label()]))
            ->action(__('View or cancel booking'), $this->booking->manageUrl())
            ->line(__('Keep this email. The link above is how you manage your booking.'));
    }
}
