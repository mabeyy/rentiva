<?php

namespace App\Models;

use App\Actions\Integrations\NotifyBookingEvent;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * One entry in the activity log: what happened to a booking, or to a car
 * (like blocked dates), and who did it.
 *
 * @property int $id
 * @property int|null $booking_id
 * @property int|null $car_id Set for car events, which have no booking.
 * @property string $action e.g. "confirmed" or "payment_submitted".
 * @property string $actor_type renter, owner, admin or system.
 * @property string $actor_name
 * @property string|null $description
 * @property Carbon|null $created_at
 */
#[Fillable(['action', 'actor_type', 'actor_name', 'description'])]
class BookingEvent extends Model
{
    public const UPDATED_AT = null;

    /** Every action the log records, in the order a booking usually goes. */
    /** Events about money, shown only to people who handle payments. */
    public const array MONEY_ACTIONS = ['payment_submitted', 'payment_approved', 'payment_rejected', 'refunded', 'charged', 'deposit_collected', 'deposit_returned'];

    public const array ACTIONS = [
        'requested', 'added', 'confirmed', 'declined', 'cancelled', 'completed',
        'payment_submitted', 'payment_approved', 'payment_rejected', 'reviewed', 'license_checked', 'replied',
        'changed', 'change_requested', 'change_withdrawn', 'change_declined', 'refunded', 'charged', 'deposit_collected', 'deposit_returned', 'pickup_checked', 'return_checked',
        'blocked', 'block_changed', 'unblocked',
    ];

    /**
     * Send texts and update the owner's calendar for each new booking event,
     * in the background and only once the change is saved.
     */
    protected static function booted(): void
    {
        static::created(function (BookingEvent $event): void {
            if ($event->booking_id === null) {
                return;
            }

            $eventId = $event->id;

            dispatch(function () use ($eventId): void {
                $event = BookingEvent::find($eventId);

                if ($event) {
                    app(NotifyBookingEvent::class)->handle($event);
                }
            })->afterCommit();
        });
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

    /**
     * Limit to events on the owner's bookings or cars.
     *
     * @param  Builder<BookingEvent>  $query
     */
    #[Scope]
    protected function forOwner(Builder $query, int $ownerId): void
    {
        $query->where(fn (Builder $inner) => $inner
            ->whereHas('booking.car', fn (Builder $car) => $car->where('owner_id', $ownerId))
            ->orWhereHas('car', fn (Builder $car) => $car->where('owner_id', $ownerId)));
    }

    /**
     * The car the event is about, whether it's a booking or a car event.
     */
    public function subjectCar(): ?Car
    {
        return $this->booking->car ?? $this->car;
    }
}
