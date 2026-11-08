<?php

namespace App\Notifications;

use App\Actions\Integrations\OwnerMailer;
use App\Enums\PaymentStatus;
use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PaymentReviewed extends Notification implements ShouldQueue
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
     * Tell the guest renter whether the owner accepted their transfer.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $message = app(OwnerMailer::class)->apply(new MailMessage, $this->booking->car->owner->storefront)->greeting(__('Hi :name,', ['name' => $this->booking->renter_name]));

        if ($this->booking->payment_status === PaymentStatus::Paid) {
            return $message
                ->subject(__('Payment received for :reference', ['reference' => $this->booking->reference]))
                ->line(__('The owner received your :total payment for the :car (:period). You are all set.', [
                    'total' => $this->booking->formattedTransferAmount(),
                    'car' => $this->booking->car->name,
                    'period' => $this->booking->period(),
                ]))
                ->action(__('View booking'), $this->booking->manageUrl());
        }

        return $message
            ->subject(__('Please resend your payment for :reference', ['reference' => $this->booking->reference]))
            ->line(__('The owner could not confirm your transfer for the :car.', ['car' => $this->booking->car->name]))
            ->line(__('Reason: :reason', ['reason' => $this->booking->payment_rejection_reason]))
            ->action(__('Send payment again'), $this->booking->manageUrl());
    }
}
