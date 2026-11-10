<?php

namespace App\Notifications;

use App\Models\Car;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Reminds the owner that a car's registration (and the CTPL insurance
 * renewed with it) runs out soon.
 */
class CarPaperExpiring extends Notification implements ShouldQueue
{
    use Queueable;

    /** Skip quietly if the booking, car or invoice was deleted before it sent. */
    public bool $deleteWhenMissingModels = true;

    /**
     * @param  string  $paper  The paper running out: "registration".
     */
    public function __construct(public Car $car, public string $paper, public int $daysLeft) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject($this->title())
            ->line($this->body())
            ->line(__('Renew it so the car can keep taking bookings.'))
            ->action(__('Open the car'), route('lessor.cars.edit', $this->car));
    }

    /**
     * @return array{action: string, title: string, body: string, url: string}
     */
    public function toArray(object $notifiable): array
    {
        return [
            'action' => 'paper_expiring',
            'title' => $this->title(),
            'body' => $this->body(),
            'url' => route('lessor.cars.edit', $this->car, absolute: false),
        ];
    }

    private function title(): string
    {
        return $this->daysLeft <= 0
            ? __(':car: :paper expired', ['car' => $this->car->name, 'paper' => ucfirst($this->paper)])
            : __(':car: :paper expires in :days days', ['car' => $this->car->name, 'paper' => $this->paper, 'days' => $this->daysLeft]);
    }

    private function body(): string
    {
        $date = $this->car->registration_expires_on;

        return __('The :paper for :plate runs out on :date.', [
            'paper' => $this->paper,
            'plate' => $this->car->plate_number ?: $this->car->name,
            'date' => $date?->format('M j, Y'),
        ]);
    }
}
