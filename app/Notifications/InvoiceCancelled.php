<?php

namespace App\Notifications;

use App\Models\Invoice;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Tells an owner Rentiva cancelled one of their invoices, so they don't need
 * to pay it, and why.
 */
class InvoiceCancelled extends Notification implements ShouldQueue
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
            ->subject(__('Invoice :number was cancelled', ['number' => $this->invoice->number]))
            ->line(__('We cancelled invoice :number for :amount, so there\'s nothing to pay for it.', [
                'number' => $this->invoice->number,
                'amount' => $this->invoice->formattedAmount(),
            ]))
            ->line(__('Reason: :reason', ['reason' => $this->invoice->cancel_reason]))
            ->action(__('See billing'), route('lessor.billing.index'));
    }

    /**
     * @return array{action: string, title: string, body: string, url: string}
     */
    public function toArray(object $notifiable): array
    {
        return [
            'action' => 'invoice_cancelled',
            'title' => __('Invoice cancelled'),
            'body' => __(':number: :reason', ['number' => $this->invoice->number, 'reason' => $this->invoice->cancel_reason]),
            'url' => route('lessor.billing.index', absolute: false),
        ];
    }
}
