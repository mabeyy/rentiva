<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Password;

/**
 * Invites a new staff member and lets them choose a password.
 */
class StaffInvitation extends Notification
{
    use Queueable;

    public function __construct(public User $owner) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(User $notifiable): MailMessage
    {
        $business = $this->owner->storefront?->name ?? $this->owner->name;
        $url = route('password.reset', ['token' => Password::createToken($notifiable), 'email' => $notifiable->email]);

        return (new MailMessage)
            ->subject(__(':business added you to their team on :app', ['business' => $business, 'app' => config('app.name')]))
            ->greeting(__('Hi :name,', ['name' => $notifiable->name]))
            ->line(__(':owner invited you to help run :business on :app.', ['owner' => $this->owner->name, 'business' => $business, 'app' => config('app.name')]))
            ->action(__('Choose your password'), $url)
            ->line(__('Then sign in with :email.', ['email' => $notifiable->email]));
    }
}
