<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Database\Factories\InvoiceFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Number;
use Illuminate\Support\Str;

/**
 * A month of an owner's plan, paid to Rentiva by bank transfer.
 *
 * @property int $id
 * @property string $number e.g. "INV-2026-0042".
 * @property int|null $owner_id Null once the owner deleted their account.
 * @property string|null $billed_to The business name, kept after the owner's account is deleted.
 * @property int|null $plan_id
 * @property string $plan_name
 * @property CarbonImmutable $period_start
 * @property CarbonImmutable $period_end
 * @property int $amount In centavos.
 * @property string $status unpaid, submitted, paid, rejected or cancelled.
 * @property CarbonImmutable $due_on
 * @property string|null $payment_reference
 * @property string|null $proof_path Transfer screenshot on the private disk.
 * @property Carbon|null $submitted_at
 * @property Carbon|null $paid_at
 * @property string|null $rejection_reason
 * @property string|null $cancel_reason Why an admin cancelled it, shown to the owner.
 */
#[Fillable(['owner_id', 'plan_id', 'plan_name', 'period_start', 'period_end', 'amount', 'status', 'due_on'])]
class Invoice extends Model
{
    /** @use HasFactory<InvoiceFactory> */
    use HasFactory;

    /** Days an owner has to pay after the invoice is issued. */
    public const int DAYS_TO_PAY = 2;

    /**
     * Number new invoices.
     */
    protected static function booted(): void
    {
        static::creating(function (Invoice $invoice): void {
            $invoice->number ??= 'INV-'.now()->format('Y').'-'.Str::upper(Str::random(6));
        });
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'period_start' => 'immutable_date',
            'period_end' => 'immutable_date',
            'due_on' => 'immutable_date',
            'submitted_at' => 'datetime',
            'paid_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * Whether the owner still has to pay (or re-send) this invoice.
     */
    public function isPayable(): bool
    {
        return in_array($this->status, ['unpaid', 'rejected'], true);
    }

    /**
     * Whether payment is late.
     */
    public function isOverdue(): bool
    {
        return $this->isPayable() && $this->due_on->endOfDay()->isPast();
    }

    /**
     * e.g. "₱1,499.00".
     */
    public function formattedAmount(): string
    {
        return (string) Number::currency($this->amount / 100, 'PHP', 'en_PH');
    }
}
