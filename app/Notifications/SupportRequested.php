<?php

namespace App\Notifications;

use App\Models\SupportRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * A question from the Help page: emailed to Rentiva support (replying goes
 * straight back to the sender) and shown in admins' notification bell.
 */
class SupportRequested extends Notification implements ShouldQueue
{
    use Queueable;

    /** Skip quietly if the booking, car or invoice was deleted before it sent. */
    public bool $deleteWhenMissingModels = true;

    public function __construct(public SupportRequest $supportRequest) {}

    /**
     * The support inbox gets the email; admins get a bell alert.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return $notifiable instanceof AnonymousNotifiable ? ['mail'] : ['database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $sender = $this->supportRequest->user;
        $business = $this->supportRequest->businessName();

        $mail = (new MailMessage)
            ->subject(__('Help request: :topic', ['topic' => $this->supportRequest->topicLabel()]))
            ->replyTo($sender->email, $sender->name)
            ->line(__('From :name (:email):business', [
                'name' => $sender->name,
                'email' => $sender->email,
                'business' => $business ? ', '.$business : '',
            ]))
            ->when($this->supportRequest->reference, fn (MailMessage $mail) => $mail->line(__('About: :reference', ['reference' => $this->supportRequest->reference])))
            ->line($this->supportRequest->message)
            ->action(__('Open in admin'), route('admin.support.index'));

        $screenshot = $this->supportRequest->screenshot_path;

        if ($screenshot && Storage::disk('local')->exists($screenshot)) {
            $mail->attach(Storage::disk('local')->path($screenshot));
        }

        return $mail;
    }

    /**
     * @return array{action: string, title: string, body: string, url: string}
     */
    public function toArray(object $notifiable): array
    {
        return [
            'action' => 'support_request',
            'title' => __('Help request: :topic', ['topic' => $this->supportRequest->topicLabel()]),
            'body' => __(':name: :message', [
                'name' => $this->supportRequest->businessName() ?? $this->supportRequest->user->name,
                'message' => Str::limit($this->supportRequest->message, 80),
            ]),
            'url' => route('admin.support.index', absolute: false),
        ];
    }
}
