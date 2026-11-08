<?php

namespace App\Models;

use App\Enums\BlockReason;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Database\Factories\CarBlockFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Days an owner takes a car off the calendar. Unlike a booking, both the
 * start and end dates are unavailable.
 *
 * @property int $id
 * @property int $car_id
 * @property CarbonImmutable $start_date
 * @property CarbonImmutable $end_date
 * @property BlockReason $reason
 * @property string|null $note
 */
#[Fillable(['start_date', 'end_date', 'reason', 'note'])]
class CarBlock extends Model
{
    /** @use HasFactory<CarBlockFactory> */
    use HasFactory;

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
            'reason' => BlockReason::class,
        ];
    }

    /**
     * @return BelongsTo<Car, $this>
     */
    public function car(): BelongsTo
    {
        return $this->belongsTo(Car::class);
    }

    /**
     * Limit to blocks clashing with a rental from pickup to return. The car
     * can come back on a blocked day's start, but not be picked up on one.
     *
     * @param  Builder<CarBlock>  $query
     */
    #[Scope]
    protected function overlappingRental(Builder $query, CarbonInterface $startDate, CarbonInterface $endDate): void
    {
        $query->whereDate($query->qualifyColumn('start_date'), '<', $endDate)
            ->whereDate($query->qualifyColumn('end_date'), '>=', $startDate);
    }

    /**
     * Limit to blocks that have not ended yet.
     *
     * @param  Builder<CarBlock>  $query
     */
    #[Scope]
    protected function upcoming(Builder $query): void
    {
        $query->whereDate($query->qualifyColumn('end_date'), '>=', today());
    }

    /**
     * The block as a rental-style range, where the end date is free again.
     *
     * @return array{start_date: string, end_date: string}
     */
    public function asRentalRange(): array
    {
        return [
            'start_date' => $this->start_date->toDateString(),
            'end_date' => $this->end_date->addDay()->toDateString(),
        ];
    }

    /**
     * e.g. "Nov 12 – 14, 2026" or "Nov 12, 2026" for one day.
     */
    public function period(): string
    {
        return match (true) {
            $this->start_date->isSameDay($this->end_date) => $this->start_date->format('M j, Y'),
            ! $this->start_date->isSameYear($this->end_date) => $this->start_date->format('M j, Y').' – '.$this->end_date->format('M j, Y'),
            $this->start_date->isSameMonth($this->end_date) => $this->start_date->format('M j').' – '.$this->end_date->format('j, Y'),
            default => $this->start_date->format('M j').' – '.$this->end_date->format('M j, Y'),
        };
    }

    /**
     * The block for the activity log, e.g. "Nov 12 – 14, 2026 · Maintenance · Change oil".
     */
    public function summary(): string
    {
        return collect([$this->period(), $this->reason->label(), $this->note])->filter()->implode(' · ');
    }
}
