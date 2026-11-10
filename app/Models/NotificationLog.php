<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\MassPrunable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * One email or SMS the system tried to send, and whether it went through.
 *
 * @property int $id
 * @property int|null $storefront_id
 * @property int|null $booking_id
 * @property string $channel mail or sms.
 * @property string $recipient
 * @property string $summary e.g. the email subject or SMS text.
 * @property string $status sent or failed.
 * @property string|null $error
 * @property Carbon|null $created_at
 */
#[Fillable(['storefront_id', 'booking_id', 'channel', 'recipient', 'summary', 'status', 'error'])]
class NotificationLog extends Model
{
    use MassPrunable;

    /** Days the delivery log keeps an entry: long enough to sort out a missed email. */
    public const int KEEP_DAYS = 90;

    /**
     * Entries old enough to drop: they hold renters' contact details.
     *
     * @return Builder<self>
     */
    public function prunable(): Builder
    {
        return self::query()->where('created_at', '<=', now()->subDays(self::KEEP_DAYS));
    }

    public const UPDATED_AT = null;

    /**
     * Record an email or SMS attempt.
     */
    public static function record(?Booking $booking, string $channel, string $recipient, string $summary, bool $sent, ?string $error = null, ?Storefront $storefront = null): self
    {
        return self::create([
            'storefront_id' => $storefront->id ?? $booking?->car?->owner?->storefront?->id,
            'booking_id' => $booking?->id,
            'channel' => $channel,
            'recipient' => $recipient,
            'summary' => mb_strimwidth($summary, 0, 250, '…'),
            'status' => $sent ? 'sent' : 'failed',
            'error' => $error ? mb_strimwidth($error, 0, 1000, '…') : null,
        ]);
    }

    /**
     * @return BelongsTo<Booking, $this>
     */
    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    /**
     * @return BelongsTo<Storefront, $this>
     */
    public function storefront(): BelongsTo
    {
        return $this->belongsTo(Storefront::class);
    }
}
