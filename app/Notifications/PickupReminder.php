<?php

namespace App\Notifications;

use App\Actions\Integrations\OwnerMailer;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PickupReminder extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance. `$hoursBefore` is 24 or 2.
     */
    public function __construct(public Booking $booking, public int $hoursBefore)
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
     * Remind the guest renter of their pickup, from the owner's own address
     * when they have connected one.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $booking = $this->booking;
        $storefront = $booking->car->owner->storefront;
        $when = $this->hoursBefore === 24
            ? __('tomorrow at :time', ['time' => $booking->pickupAt()->format('g:i A')])
            : __('in about 2 hours, at :time', ['time' => $booking->pickupAt()->format('g:i A')]);
        $location = $booking->car->pickupLocation;

        $message = app(OwnerMailer::class)->apply(new MailMessage, $storefront)
            ->subject(__('Reminder: your :car pickup is :when', ['car' => $booking->car->name, 'when' => $when]))
            ->greeting(__('Hi :name,', ['name' => $booking->renter_name]))
            ->line(__('This is a reminder that you pick up the :car :when.', ['car' => $booking->car->name, 'when' => $when]));

        if ($location) {
            $message->line(__('Pickup: :address, :city', ['address' => $location->address, 'city' => $location->city]));
        }

        $message->line(__('Booking :reference · :period · :total', [
            'reference' => $booking->reference,
            'period' => $booking->period(),
            'total' => $booking->formattedTotal(),
        ]));

        if ($booking->payment_method === PaymentMethod::PayAtPickup) {
            $message->line(__('Please bring the total to pay at pickup, plus your driver’s license.'));
        } elseif ($booking->payment_status !== PaymentStatus::Paid) {
            $message->line(__('Your bank transfer has not been confirmed yet. Please check your booking.'));
        } else {
            $message->line(__('Your payment is confirmed. Please bring your driver’s license.'));
        }

        return $message->action(__('View booking'), $booking->manageUrl());
    }
}
