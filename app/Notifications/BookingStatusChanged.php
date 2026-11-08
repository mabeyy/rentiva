<?php

namespace App\Notifications;

use App\Actions\Integrations\OwnerMailer;
use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class BookingStatusChanged extends Notification implements ShouldQueue
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
     * Tell the guest renter their booking's new status.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $message = app(OwnerMailer::class)->apply(new MailMessage, $this->booking->car->owner->storefront)
            ->subject(__('Booking :reference is now :status', [
                'reference' => $this->booking->reference,
                'status' => strtolower($this->booking->status->label()),
            ]))
            ->greeting(__('Hi :name,', ['name' => $this->booking->renter_name]))
            ->line(__('Your booking for the :car (:period) is now :status.', [
                'car' => $this->booking->car->name,
                'period' => $this->booking->period(),
                'status' => strtolower($this->booking->status->label()),
            ]));

        if ($this->booking->decline_reason) {
            $message->line(__('Reason: :reason', ['reason' => $this->booking->decline_reason]));
        }

        return $message->action(__('View booking'), $this->booking->manageUrl());
    }
}
