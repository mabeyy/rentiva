<?php

namespace App\Models;

use App\Enums\BookingSource;
use App\Enums\BookingStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\RenterCancellation;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Database\Factories\BookingFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\RouteKey;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Number;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property string $reference
 * @property int $car_id
 * @property string $renter_name
 * @property string|null $renter_email Optional for bookings an owner adds.
 * @property string $renter_phone
 * @property string|null $renter_phone_key The phone normalized to 09XXXXXXXXX, to match renters.
 * @property string|null $renter_license_number Optional for bookings an owner adds.
 * @property string|null $license_photo_path License photo on the private disk.
 * @property Carbon|null $license_checked_at When the owner checked the license.
 * @property CarbonImmutable $start_date
 * @property CarbonImmutable $end_date
 * @property int $daily_rate Daily rate in centavos at booking time.
 * @property int $subtotal Days × daily rate, in centavos.
 * @property int $discount Long-stay discount, in centavos.
 * @property int $delivery_fee In centavos.
 * @property int $driver_fee In centavos.
 * @property int $charges_total Extra charges added after booking, in centavos.
 * @property int $total What the renter pays, in centavos.
 * @property int $down_payment Due by bank transfer when the owner asks for a down payment; the rest is paid at pickup.
 * @property Carbon|null $deposit_collected_at
 * @property int|null $deposit_returned_amount How much of the deposit went back to the renter.
 * @property Carbon|null $deposit_returned_at
 * @property string|null $deposit_note Why part of the deposit was kept.
 * @property int|null $refund_amount What went back to the renter after a cancellation.
 * @property Carbon|null $refunded_at
 * @property string|null $refund_reference
 * @property string|null $refund_note
 * @property array{start_date: string, end_date: string, note: string|null, requested_at: string}|null $change_request The renter's pending request to move their dates.
 * @property int $security_deposit Refundable, collected at pickup and not part of the total.
 * @property bool $with_driver
 * @property string|null $delivery_address Set when the car is delivered.
 * @property BookingSource $source
 * @property BookingStatus $status
 * @property string|null $notes
 * @property string|null $decline_reason
 * @property PaymentMethod $payment_method
 * @property PaymentStatus $payment_status
 * @property Carbon|null $payment_due_at When an unpaid bank transfer booking is released.
 * @property string|null $payment_reference Bank reference the renter typed back.
 * @property string|null $payment_proof_path Transfer screenshot on the private disk.
 * @property int|null $amount_paid Centavos the renter paid, recorded when the payment was confirmed.
 * @property string|null $cancel_reason Why it was cancelled, shown to the renter.
 * @property string|null $payment_rejection_reason
 * @property Carbon|null $payment_submitted_at
 * @property Carbon|null $paid_at
 * @property Carbon|null $anonymized_at When the renter's personal details were stripped.
 * @property Carbon|null $reminder_24h_sent_at
 * @property Carbon|null $reminder_2h_sent_at
 * @property string|null $google_event_id The event mirroring this booking on the owner's Google Calendar.
 * @property Carbon|null $confirmed_at
 * @property Carbon|null $declined_at
 * @property Carbon|null $cancelled_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[RouteKey('reference')]
#[Fillable([
    'renter_name', 'renter_email', 'renter_phone', 'renter_license_number',
    'start_date', 'end_date', 'daily_rate', 'subtotal', 'discount', 'delivery_fee', 'driver_fee',
    'total', 'security_deposit', 'with_driver', 'delivery_address', 'source', 'status', 'notes',
    'decline_reason', 'confirmed_at', 'declined_at', 'cancelled_at', 'payment_method',
])]
class Booking extends Model
{
    /** @use HasFactory<BookingFactory> */
    use HasFactory;

    /**
     * The model's default values for attributes.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'status' => 'pending',
        'payment_method' => 'pickup',
        'payment_status' => 'unpaid',
        'source' => 'online',
    ];

    /**
     * Generate a unique, human-friendly reference when the booking is created.
     */
    protected static function booted(): void
    {
        static::creating(function (Booking $booking): void {
            $booking->reference ??= self::generateReference();
        });

        static::saving(function (Booking $booking): void {
            if ($booking->isDirty('renter_phone')) {
                $booking->renter_phone_key = self::phoneKey($booking->renter_phone);
            }
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
            'start_date' => 'immutable_date',
            'end_date' => 'immutable_date',
            'status' => BookingStatus::class,
            'confirmed_at' => 'datetime',
            'declined_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'payment_method' => PaymentMethod::class,
            'payment_status' => PaymentStatus::class,
            'payment_due_at' => 'datetime',
            'payment_submitted_at' => 'datetime',
            'paid_at' => 'datetime',
            'anonymized_at' => 'datetime',
            'reminder_24h_sent_at' => 'datetime',
            'reminder_2h_sent_at' => 'datetime',
            'license_checked_at' => 'datetime',
            'deposit_collected_at' => 'datetime',
            'deposit_returned_at' => 'datetime',
            'refunded_at' => 'datetime',
            'change_request' => 'array',
            'with_driver' => 'boolean',
            'source' => BookingSource::class,
        ];
    }

    /**
     * Normalize a Philippine mobile number to 09XXXXXXXXX, so the same renter
     * matches however they typed it.
     */
    public static function phoneKey(string $phone): string
    {
        return (string) preg_replace('/^63/', '0', (string) preg_replace('/\D/', '', $phone));
    }

    /**
     * @return BelongsTo<Car, $this>
     */
    public function car(): BelongsTo
    {
        return $this->belongsTo(Car::class);
    }

    /**
     * @return HasMany<BookingEvent, $this>
     */
    public function events(): HasMany
    {
        return $this->hasMany(BookingEvent::class);
    }

    /**
     * Add an entry to the activity log. The actor is whoever is signed in (the
     * car's owner, or an admin); with nobody signed in it is the guest renter,
     * unless the change was made automatically by the system.
     */
    public function recordEvent(string $action, ?string $description = null, bool $bySystem = false): BookingEvent
    {
        $user = $bySystem ? null : Auth::user();
        $staff = $bySystem ? null : TeamMember::acting();
        $impersonator = $bySystem ? null : User::impersonator();

        return $this->events()->create([
            'action' => $action,
            'actor_type' => match (true) {
                $bySystem => 'system',
                $impersonator !== null => 'admin',
                $staff !== null => 'staff',
                $user === null => 'renter',
                $user->id === $this->car->owner_id => 'owner',
                default => 'admin',
            },
            'actor_name' => $bySystem ? config('app.name') : ($impersonator->name ?? $staff->name ?? $user->name ?? $this->renter_name),
            'description' => $description,
        ]);
    }

    /**
     * Why the renter may not cancel this booking from its link, or null when
     * they may. A request the owner hasn't confirmed can always be withdrawn;
     * once confirmed, the owner's booking policy decides.
     */
    public function renterCancellationBlockedReason(): ?string
    {
        if (! $this->status->canTransitionTo(BookingStatus::Cancelled)) {
            return __('This booking can no longer be cancelled.');
        }

        $storefront = $this->car->owner->storefront;

        if ($this->status === BookingStatus::Pending || ! $storefront) {
            return null;
        }

        $reason = match ($storefront->renter_cancellation) {
            RenterCancellation::Anytime => null,
            RenterCancellation::Never => __('This owner doesn\'t allow cancelling online. Call or message them to change or cancel your booking.'),
            RenterCancellation::WithNotice => now()->greaterThan($this->start_date->startOfDay()->subHours($storefront->cancellation_notice_hours))
                ? __('Online cancelling closed :hours hours before pickup. Call or message the owner to change your booking.', ['hours' => $storefront->cancellation_notice_hours])
                : null,
        };

        return is_string($reason) ? $reason : null;
    }

    /** Pickup times are set in Philippine time, which is also the app's own time zone. */
    public const string PICKUP_TIMEZONE = 'Asia/Manila';

    /**
     * When the renter picks the car up: the pickup date at the owner's usual
     * pickup time, in Philippine time.
     */
    public function pickupAt(): CarbonImmutable
    {
        $time = $this->car->owner->storefront->pickup_time ?? '09:00';

        return CarbonImmutable::parse("{$this->start_date->toDateString()} {$time}", self::PICKUP_TIMEZONE);
    }

    /**
     * Start (or restart) the clock for the renter to send a bank transfer,
     * using the owner's deadline.
     */
    public function startTransferDeadline(): void
    {
        $minutes = $this->car->owner->storefront->transfer_deadline_minutes ?? 60;

        $this->forceFill(['payment_due_at' => now()->addMinutes($minutes)])->save();
    }

    /**
     * @return HasOne<Review, $this>
     */
    public function review(): HasOne
    {
        return $this->hasOne(Review::class);
    }

    /**
     * Whether the renter should send (or resend) a bank transfer: the owner has
     * confirmed, and no accepted transfer is on file yet.
     */
    public function awaitsTransfer(): bool
    {
        return $this->payment_method === PaymentMethod::BankTransfer
            && $this->status === BookingStatus::Confirmed
            && in_array($this->payment_status, [PaymentStatus::Unpaid, PaymentStatus::Rejected], true);
    }

    /**
     * Whether the owner has a submitted transfer to check.
     */
    public function hasTransferToCheck(): bool
    {
        return $this->payment_status === PaymentStatus::Submitted;
    }

    /**
     * Whether the renter may still rate this booking: the trip is done and unrated.
     */
    public function isReviewable(): bool
    {
        return $this->status === BookingStatus::Completed && ! $this->review()->exists();
    }

    /**
     * Limit to bookings that hold the car's dates.
     *
     * @param  Builder<Booking>  $query
     */
    #[Scope]
    protected function reserving(Builder $query): void
    {
        $query->inStatus(...BookingStatus::reserving());
    }

    /**
     * Limit to bookings in any of the given statuses.
     *
     * @param  Builder<Booking>  $query
     */
    #[Scope]
    protected function inStatus(Builder $query, BookingStatus|string ...$statuses): void
    {
        $query->whereIn($query->qualifyColumn('status'), $statuses);
    }

    /**
     * Limit to bookings overlapping the given range. The return date is free for a new pickup.
     *
     * @param  Builder<Booking>  $query
     */
    #[Scope]
    protected function overlapping(Builder $query, CarbonInterface $startDate, CarbonInterface $endDate): void
    {
        $query->whereDate($query->qualifyColumn('start_date'), '<', $endDate)
            ->whereDate($query->qualifyColumn('end_date'), '>', $startDate);
    }

    /**
     * Get the number of rental days.
     */
    public function days(): int
    {
        return (int) $this->start_date->diffInDays($this->end_date);
    }

    /**
     * Get the signed link a guest renter uses to view or cancel the booking.
     */
    public function manageUrl(): string
    {
        return URL::signedRoute('bookings.show', $this);
    }

    /**
     * Get the total formatted in Philippine pesos.
     */
    public function formattedTotal(): string
    {
        return (string) Number::currency($this->total / 100, 'PHP', 'en_PH');
    }

    /**
     * The amount the renter transfers, e.g. "₱1,500.00".
     */
    public function formattedTransferAmount(): string
    {
        return (string) Number::currency($this->transferAmount() / 100, 'PHP', 'en_PH');
    }

    /**
     * Get the rental period, e.g. "Nov 10 – Nov 13, 2026".
     */
    public function period(): string
    {
        return $this->start_date->format('M j').' – '.$this->end_date->format('M j, Y');
    }

    /**
     * Generate a reference such as "RNT-7KQ2XM" that is not yet in use.
     */
    public static function generateReference(): string
    {
        do {
            $reference = 'RNT-'.Str::upper(Str::random(6));
        } while (self::where('reference', $reference)->exists());

        return $reference;
    }

    /**
     * @return HasMany<BookingCharge, $this>
     */
    public function charges(): HasMany
    {
        return $this->hasMany(BookingCharge::class);
    }

    /**
     * @return HasMany<BookingInspection, $this>
     */
    public function inspections(): HasMany
    {
        return $this->hasMany(BookingInspection::class);
    }

    /**
     * Recompute the total from its parts after a change or a new charge.
     */
    public function recalculateTotal(): void
    {
        $this->charges_total = (int) $this->charges()->sum('amount');
        $this->total = $this->subtotal - $this->discount + $this->delivery_fee + $this->driver_fee + $this->charges_total;
    }

    /**
     * What the renter transfers: the down payment when one was asked for,
     * otherwise the full total.
     */
    public function transferAmount(): int
    {
        return $this->down_payment > 0 ? $this->down_payment : $this->total;
    }

    /**
     * What's left to pay at pickup: the total less what was already paid, so
     * a charge or longer dates added after paying still shows as owed.
     */
    public function balanceDue(): int
    {
        return max(0, $this->total - $this->amountPaid());
    }

    /**
     * What the renter has paid, as recorded when the payment was confirmed.
     * It stays put when the total changes later.
     */
    public function amountPaid(): int
    {
        return $this->payment_status === PaymentStatus::Paid ? ($this->amount_paid ?? $this->transferAmount()) : 0;
    }

    /**
     * How much the renter paid over the total, e.g. after shorter dates.
     */
    public function overpaid(): int
    {
        return max(0, $this->amountPaid() - $this->total);
    }

    /**
     * Whether a cancelled or declined booking still owes the renter a refund decision.
     */
    public function needsRefund(): bool
    {
        return in_array($this->status, [BookingStatus::Cancelled, BookingStatus::Declined], true)
            && $this->amountPaid() > 0
            && $this->refunded_at === null;
    }
}
