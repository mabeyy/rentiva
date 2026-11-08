<?php

namespace App\Notifications;

use App\Actions\Integrations\OwnerMailer;
use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Number;

class RefundRecorded extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Booking $booking) {}

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
     * Tell the renter what was refunded, and why anything was kept.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $message = app(OwnerMailer::class)->apply(new MailMessage, $this->booking->car->owner->storefront)
            ->subject(__('Refund for booking :reference', ['reference' => $this->booking->reference]))
            ->greeting(__('Hi :name,', ['name' => $this->booking->renter_name]))
            ->line(__(':amount was refunded to you for :car, :period.', [
                'amount' => Number::currency(($this->booking->refund_amount ?? 0) / 100, 'PHP', 'en_PH'),
                'car' => $this->booking->car->name,
                'period' => $this->booking->period(),
            ]));

        if ($this->booking->refund_reference) {
            $message->line(__('Reference: :reference', ['reference' => $this->booking->refund_reference]));
        }

        if ($this->booking->refund_note) {
            $message->line(__('Note from the owner: :note', ['note' => $this->booking->refund_note]));
        }

        return $message->action(__('View booking'), $this->booking->manageUrl());
    }
}
