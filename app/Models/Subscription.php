<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Database\Factories\SubscriptionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * An owner's plan with Rentiva, invoiced monthly from the day they pick it.
 *
 * @property int $id
 * @property int $owner_id
 * @property int|null $plan_id
 * @property string $billing_cycle "monthly" or "yearly" (two months free).
 * @property CarbonImmutable|null $current_period_end The last day already invoiced.
 * @property Carbon|null $cancelled_at Set when the owner cancels; the plan runs until current_period_end, then ends.
 * @property int|null $pending_plan_id A downgrade or cycle change that starts with the next period.
 * @property string|null $pending_billing_cycle
 * @property int|null $anchor_day The day of the month periods start on, kept after short months.
 */
#[Fillable(['owner_id', 'plan_id', 'billing_cycle', 'current_period_end', 'cancelled_at', 'pending_plan_id', 'pending_billing_cycle', 'anchor_day'])]
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
            'cancelled_at' => 'datetime',
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
     * @return BelongsTo<Plan, $this>
     */
    public function pendingPlan(): BelongsTo
    {
        return $this->belongsTo(Plan::class, 'pending_plan_id');
    }

    /**
     * The last day of a period starting on the given day: a year later, or
     * the day before the next billing day, so a plan started on the 31st
     * goes back to the 31st after February instead of drifting to the 28th.
     */
    public function periodEnd(CarbonImmutable $start): CarbonImmutable
    {
        if ($this->isYearly()) {
            return $start->addYearNoOverflow()->subDay();
        }

        $nextMonth = $start->startOfMonth()->addMonth();
        $anchor = $this->anchor_day ?? $start->day;

        return $nextMonth->setDay(min($anchor, $nextMonth->daysInMonth))->subDay();
    }

    /**
     * The first day of the period that ends on current_period_end, worked out
     * from the cycle and billing day rather than from invoices (one may have
     * been cancelled).
     */
    public function currentPeriodStart(): ?CarbonImmutable
    {
        if ($this->current_period_end === null) {
            return null;
        }

        $nextStart = $this->current_period_end->addDay();

        if ($this->isYearly()) {
            return $nextStart->subYearNoOverflow();
        }

        $previousMonth = $nextStart->startOfMonth()->subMonth();
        $anchor = $this->anchor_day ?? $nextStart->day;

        return $previousMonth->setDay(min($anchor, $previousMonth->daysInMonth));
    }

    /**
     * What one period of a plan costs on this subscription's cycle.
     */
    public function priceOf(Plan $plan, ?string $cycle = null): int
    {
        return ($cycle ?? $this->billing_cycle) === 'yearly' ? $plan->yearlyPrice() : $plan->price;
    }

    /**
     * Forget the current period, for an owner taken off their plan.
     */
    public function reset(): void
    {
        $this->update([
            'plan_id' => null,
            'current_period_end' => null,
            'cancelled_at' => null,
            'pending_plan_id' => null,
            'pending_billing_cycle' => null,
            'anchor_day' => null,
        ]);
    }

    /**
     * Whether the owner pays a year at a time.
     */
    public function isYearly(): bool
    {
        return $this->billing_cycle === 'yearly';
    }
}
