<?php

namespace App\Notifications;

use App\Models\Invoice;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Tells admins an owner paid an invoice and it's waiting to be checked.
 */
class InvoicePaymentSubmitted extends Notification implements ShouldQueue
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
            ->subject(__('Payment to check: :number', ['number' => $this->invoice->number]))
            ->line(__(':owner paid :amount for :number (reference :reference).', [
                'owner' => $this->ownerName(),
                'amount' => $this->invoice->formattedAmount(),
                'number' => $this->invoice->number,
                'reference' => $this->invoice->payment_reference,
            ]))
            ->action(__('Check payment'), route('admin.billing.index', ['status' => 'submitted']));
    }

    /**
     * @return array{action: string, title: string, body: string, url: string}
     */
    public function toArray(object $notifiable): array
    {
        return [
            'action' => 'invoice_submitted',
            'title' => __('Payment to check'),
            'body' => __(':owner sent :amount', ['owner' => $this->ownerName(), 'amount' => $this->invoice->formattedAmount()]),
            'url' => route('admin.billing.index', ['status' => 'submitted'], absolute: false),
        ];
    }

    private function ownerName(): string
    {
        return $this->invoice->owner->storefront->name ?? $this->invoice->owner->name;
    }
}
