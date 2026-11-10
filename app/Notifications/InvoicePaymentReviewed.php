<?php

namespace App\Notifications;

use App\Models\Invoice;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Tells an owner Rentiva confirmed their invoice payment, or sent it back
 * with the reason so they can pay again.
 */
class InvoicePaymentReviewed extends Notification implements ShouldQueue
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
        if ($this->isPaid()) {
            return (new MailMessage)
                ->subject(__('Payment received for :number', ['number' => $this->invoice->number]))
                ->line(__('Thanks! We received your :amount payment for :number. Your plan is paid up.', [
                    'amount' => $this->invoice->formattedAmount(),
                    'number' => $this->invoice->number,
                ]))
                ->action(__('See billing'), route('lessor.billing.index'));
        }

        return (new MailMessage)
            ->subject(__('Please send your payment for :number again', ['number' => $this->invoice->number]))
            ->line(__('We couldn\'t confirm your payment for :number: :reason', [
                'number' => $this->invoice->number,
                'reason' => $this->invoice->rejection_reason,
            ]))
            ->line(__('Please check the transfer and send it again by :date.', ['date' => $this->invoice->due_on->format('M j, Y')]))
            ->action(__('Pay invoice'), route('lessor.billing.index'));
    }

    /**
     * @return array{action: string, title: string, body: string, url: string}
     */
    public function toArray(object $notifiable): array
    {
        return [
            'action' => $this->isPaid() ? 'invoice_paid' : 'invoice_rejected',
            'title' => $this->isPaid()
                ? __('Payment received')
                : __('Payment sent back'),
            'body' => $this->isPaid()
                ? __(':number is paid. Thanks!', ['number' => $this->invoice->number])
                : __(':number: :reason', ['number' => $this->invoice->number, 'reason' => $this->invoice->rejection_reason]),
            'url' => route('lessor.billing.index', absolute: false),
        ];
    }

    private function isPaid(): bool
    {
        return $this->invoice->status === 'paid';
    }
}
