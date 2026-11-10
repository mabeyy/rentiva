<?php

namespace App\Notifications;

use App\Models\Invoice;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class InvoiceIssued extends Notification implements ShouldQueue
{
    use Queueable;

    /** Skip quietly if the booking, car or invoice was deleted before it sent. */
    public bool $deleteWhenMissingModels = true;

    public function __construct(public Invoice $invoice) {}

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
            ->subject(__('Your :app invoice :number', ['app' => config('app.name'), 'number' => $this->invoice->number]))
            ->line(__(':plan plan, :start to :end: :amount.', [
                'plan' => $this->invoice->plan_name,
                'start' => $this->invoice->period_start->format('M j'),
                'end' => $this->invoice->period_end->format('M j, Y'),
                'amount' => $this->invoice->formattedAmount(),
            ]))
            ->line(__('Please pay by :date.', ['date' => $this->invoice->due_on->format('M j, Y')]))
            ->action(__('Pay invoice'), route('lessor.billing.index'));
    }

    /**
     * @return array{action: string, title: string, body: string, url: string}
     */
    public function toArray(object $notifiable): array
    {
        return [
            'action' => 'invoice',
            'title' => __('New invoice :number', ['number' => $this->invoice->number]),
            'body' => __(':amount due :date', ['amount' => $this->invoice->formattedAmount(), 'date' => $this->invoice->due_on->format('M j')]),
            'url' => route('lessor.billing.index', absolute: false),
        ];
    }
}
