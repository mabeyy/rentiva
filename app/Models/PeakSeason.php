<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Database\Factories\PeakSeasonFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A stretch of days when the owner's rates go up (or down), like Christmas or
 * Holy Week. Both dates are included.
 *
 * @property int $id
 * @property int $owner_id
 * @property string $name
 * @property CarbonImmutable $start_date
 * @property CarbonImmutable $end_date
 * @property int $rate_change Percent added to the daily rate; negative for a low season.
 */
#[Fillable(['name', 'start_date', 'end_date', 'rate_change'])]
class PeakSeason extends Model
{
    /** @use HasFactory<PeakSeasonFactory> */
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
            'rate_change' => 'integer',
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
     * Limit to seasons that haven't ended.
     *
     * @param  Builder<PeakSeason>  $query
     */
    #[Scope]
    protected function upcoming(Builder $query): void
    {
        $query->whereDate('end_date', '>=', today());
    }

    /**
     * Whether the season covers the given day.
     */
    public function covers(CarbonInterface $day): bool
    {
        return $day->betweenIncluded($this->start_date->startOfDay(), $this->end_date->startOfDay());
    }
}
