<?php

namespace App\Notifications;

use App\Models\Invoice;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Reminds an owner an invoice is due tomorrow, or tells them it's overdue
 * and when their booking page stops taking online bookings.
 */
class InvoiceReminder extends Notification implements ShouldQueue
{
    use Queueable;

    /** Skip quietly if the booking, car or invoice was deleted before it sent. */
    public bool $deleteWhenMissingModels = true;

    public const string DueTomorrow = 'due_tomorrow';

    public const string Overdue = 'overdue';

    /**
     * @param  string  $kind  self::DueTomorrow or self::Overdue.
     * @param  int  $graceDays  Days overdue before online bookings pause.
     */
    public function __construct(public Invoice $invoice, public string $kind, public int $graceDays) {}

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
        $details = [
            'number' => $this->invoice->number,
            'amount' => $this->invoice->formattedAmount(),
            'date' => $this->invoice->due_on->format('M j, Y'),
        ];

        if ($this->kind === self::DueTomorrow) {
            return (new MailMessage)
                ->subject($this->invoice->due_on->isToday()
                    ? __('Invoice :number is due today', $details)
                    : __('Invoice :number is due tomorrow', $details))
                ->line($this->invoice->due_on->isToday()
                    ? __('A reminder that :amount for :number is due today, :date.', $details)
                    : __('A reminder that :amount for :number is due tomorrow, :date.', $details))
                ->action(__('Pay invoice'), route('lessor.billing.index'));
        }

        return (new MailMessage)
            ->subject(__('Invoice :number is overdue', $details))
            ->line(__(':amount for :number was due :date.', $details))
            ->line(__('If it stays unpaid, your booking page stops taking online bookings on :pause. Your account and data stay.', [
                'pause' => $this->invoice->due_on->addDays($this->graceDays + 1)->format('M j'),
            ]))
            ->action(__('Pay invoice'), route('lessor.billing.index'));
    }

    /**
     * @return array{action: string, title: string, body: string, url: string}
     */
    public function toArray(object $notifiable): array
    {
        return [
            'action' => $this->kind === self::DueTomorrow ? 'invoice_due' : 'invoice_overdue',
            'title' => $this->kind === self::DueTomorrow
                ? ($this->invoice->due_on->isToday() ? __('Invoice due today') : __('Invoice due tomorrow'))
                : __('Invoice overdue'),
            'body' => __(':amount for :number', ['amount' => $this->invoice->formattedAmount(), 'number' => $this->invoice->number]),
            'url' => route('lessor.billing.index', absolute: false),
        ];
    }
}
