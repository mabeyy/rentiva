<?php

namespace App\Notifications;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PaymentSubmitted extends Notification implements ShouldQueue
{
    use Queueable;

    /** Skip quietly if the booking, car or invoice was deleted before it sent. */
    public bool $deleteWhenMissingModels = true;

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
     * Ask the owner to check a bank transfer against their account.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject(__('Payment to check for :reference', ['reference' => $this->booking->reference]))
            ->line(__(':renter sent a bank transfer of :total for the :car (:period).', [
                'renter' => $this->booking->renter_name,
                'total' => $this->booking->formattedTransferAmount(),
                'car' => $this->booking->car->name,
                'period' => $this->booking->period(),
            ]))
            ->line(__('Reference: :reference', ['reference' => $this->booking->payment_reference]))
            ->line(__('Check that it reached your account, then mark it paid.'))
            ->action(__('Check payment'), route('lessor.transfers'));
    }
}
