<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Database\Factories\SubscriptionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * An owner's plan with Rentiva, invoiced monthly from the day they pick it.
 *
 * @property int $id
 * @property int $owner_id
 * @property int|null $plan_id
 * @property string $billing_cycle "monthly" or "yearly" (two months free).
 * @property CarbonImmutable|null $current_period_end The last day already invoiced.
 */
#[Fillable(['owner_id', 'plan_id', 'billing_cycle', 'current_period_end'])]
class Subscription extends Model
{
    /** @use HasFactory<SubscriptionFactory> */
    use HasFactory;

    /**
     * The model's default values for attributes.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'billing_cycle' => 'monthly',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'current_period_end' => 'immutable_date',
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
     * @return BelongsTo<Plan, $this>
     */
    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    /**
     * The owner's subscription, created the first time it's needed.
     */
    public static function for(User $owner): self
    {
        return $owner->subscription()->firstOrCreate();
    }

    /**
     * The first day not yet invoiced: today if they've never been invoiced,
     * otherwise the day after the last invoiced month.
     */
    public function nextPeriodStart(): CarbonImmutable
    {
        return $this->current_period_end?->addDay() ?? CarbonImmutable::today();
    }

    /**
     * Whether the owner pays a year at a time.
     */
    public function isYearly(): bool
    {
        return $this->billing_cycle === 'yearly';
    }
}
