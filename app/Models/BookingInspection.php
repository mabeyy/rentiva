<?php

namespace App\Models;

use Database\Factories\BookingInspectionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * The car's condition at handover or return: fuel, odometer, notes and photos.
 *
 * @property int $id
 * @property int $booking_id
 * @property string $type "pickup" or "return".
 * @property int $fuel_level In eighths of a tank, 0 to 8.
 * @property int $odometer In km.
 * @property string|null $notes
 * @property array<int, string>|null $photos Paths on the private disk.
 * @property string $recorded_by
 * @property Carbon|null $created_at
 */
#[Fillable(['type', 'fuel_level', 'odometer', 'notes', 'photos', 'recorded_by'])]
class BookingInspection extends Model
{
    /** @use HasFactory<BookingInspectionFactory> */
    use HasFactory;

    public const array TYPES = ['pickup', 'return'];

    /** Most photos one check can hold. */
    public const int MAX_PHOTOS = 8;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'photos' => 'array',
        ];
    }

    /**
     * @return BelongsTo<Booking, $this>
     */
    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }
}
