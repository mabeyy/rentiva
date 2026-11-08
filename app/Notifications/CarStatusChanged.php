<?php

namespace App\Notifications;

use App\Models\Car;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CarStatusChanged extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(public Car $car)
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
        return ['mail'];
    }

    /**
     * Tell the lessor the outcome of an admin review.
     */
    public function toMail(User $notifiable): MailMessage
    {
        $message = (new MailMessage)
            ->subject(__('Your :car listing is now :status', [
                'car' => $this->car->name,
                'status' => strtolower($this->car->status->label()),
            ]))
            ->greeting(__('Hi :name,', ['name' => $notifiable->name]))
            ->line(__('An admin reviewed your :car listing and marked it as :status.', [
                'car' => $this->car->name,
                'status' => strtolower($this->car->status->label()),
            ]));

        if ($this->car->rejection_reason) {
            $message->line(__('Reason: :reason', ['reason' => $this->car->rejection_reason]));
        }

        return $message->action(__('View listing'), route('lessor.cars.edit', $this->car));
    }
}
