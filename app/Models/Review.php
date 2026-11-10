<?php

namespace App\Models;

use Database\Factories\ReviewFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * A renter's star rating for a completed booking; one per booking.
 *
 * @property int $id
 * @property int $booking_id
 * @property int $car_id
 * @property int $rating 1 to 5 stars.
 * @property string|null $comment
 * @property string|null $owner_reply The owner's public answer.
 * @property Carbon|null $replied_at
 * @property Carbon|null $reported_at When the owner reported it to Rentiva.
 * @property string|null $report_reason
 * @property Carbon|null $hidden_at When an admin took it off public pages.
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['rating', 'comment', 'owner_reply', 'replied_at'])]
class Review extends Model
{
    /** @use HasFactory<ReviewFactory> */
    use HasFactory;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'replied_at' => 'datetime',
            'reported_at' => 'datetime',
            'hidden_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Booking, $this>
     */
    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    /**
     * @return BelongsTo<Car, $this>
     */
    public function car(): BelongsTo
    {
        return $this->belongsTo(Car::class);
    }
}
