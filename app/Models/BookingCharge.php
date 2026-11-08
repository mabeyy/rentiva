<?php

namespace App\Models;

use Database\Factories\BookingChargeFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Something added to a booking's bill after the fact: a late return, fuel,
 * cleaning, tolls or damage.
 *
 * @property int $id
 * @property int $booking_id
 * @property string $label
 * @property int $amount In centavos.
 * @property Carbon|null $created_at
 */
#[Fillable(['label', 'amount'])]
class BookingCharge extends Model
{
    /** @use HasFactory<BookingChargeFactory> */
    use HasFactory;

    /**
     * @return BelongsTo<Booking, $this>
     */
    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }
}
