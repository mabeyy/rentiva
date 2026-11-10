<?php

namespace App\Notifications;

use App\Actions\Integrations\OwnerMailer;
use App\Enums\BookingStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Number;

class BookingStatusChanged extends Notification implements ShouldQueue
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
        // Essential for the renter (their booking link and its outcome), so
        // sent on every plan.
        return ['mail'];
    }

    /**
     * Tell the guest renter their booking's new status.
     */
    public function toMail(object $notifiable): MailMessage
    {
        if ($this->booking->status === BookingStatus::Completed) {
            return $this->askForReview();
        }

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

        $reason = match ($this->booking->status) {
            BookingStatus::Declined => $this->booking->decline_reason,
            BookingStatus::Cancelled => $this->booking->cancel_reason,
            default => null,
        };

        if ($reason) {
            $message->line(__('Reason: :reason', ['reason' => $reason]));
        }

        // Confirmed but paid by transfer: tell them what to send, and by when if
        // there's a deadline (bookings the owner added have none).
        if ($this->booking->status === BookingStatus::Confirmed && $this->booking->payment_method === PaymentMethod::BankTransfer && $this->booking->payment_status !== PaymentStatus::Paid) {
            $amount = Number::currency($this->booking->transferAmount() / 100, 'PHP', 'en_PH');

            $message->line($this->booking->payment_due_at
                ? __('Next step: send :amount by bank transfer before :deadline, then add the reference number on your booking page. If it isn\'t sent by then, the booking is cancelled and the dates open up again.', [
                    'amount' => $amount,
                    'deadline' => $this->booking->payment_due_at->format('M j, g:i A'),
                ])
                : __('Next step: send :amount by bank transfer, then add the reference number on your booking page.', ['amount' => $amount]));

            return $message->action(__('Pay now'), $this->booking->manageUrl());
        }

        return $message->action(__('View booking'), $this->booking->manageUrl());
    }

    /**
     * A finished trip: thank the renter and ask them to rate it, since that
     * review is what helps the owner's next renters choose.
     */
    private function askForReview(): MailMessage
    {
        $business = $this->booking->car->owner->storefront->name ?? $this->booking->car->owner->name;

        return app(OwnerMailer::class)->apply(new MailMessage, $this->booking->car->owner->storefront)
            ->subject(__('How was your trip with :business?', ['business' => $business]))
            ->greeting(__('Hi :name,', ['name' => $this->booking->renter_name]))
            ->line(__('Thanks for renting the :car (:period) from :business.', [
                'car' => $this->booking->car->name,
                'period' => $this->booking->period(),
                'business' => $business,
            ]))
            ->line(__('Could you rate your trip? It takes a minute and helps the next renter choose.'))
            ->action(__('Rate your trip'), $this->booking->manageUrl().'#review');
    }
}
