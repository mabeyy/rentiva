<?php

namespace App\Models;

use Database\Factories\PlanFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A monthly plan Rentiva sells to owners.
 *
 * @property int $id
 * @property string $name
 * @property string|null $description
 * @property int $price Per month, in centavos.
 * @property int|null $max_cars Null for unlimited.
 * @property int|null $max_staff Null for unlimited.
 * @property array<int, string> $features Keys of FEATURES this plan unlocks.
 * @property bool $is_active Whether owners can pick it.
 * @property int $sort
 */
#[Fillable(['name', 'description', 'price', 'max_cars', 'max_staff', 'features', 'is_active', 'sort'])]
class Plan extends Model
{
    /** @use HasFactory<PlanFactory> */
    use HasFactory;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'features' => 'array',
        ];
    }

    /**
     * @return HasMany<Subscription, $this>
     */
    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    /**
     * Everything a plan can unlock, in the order pricing cards list them.
     * The app checks each one, so the cards never promise what isn't there.
     */
    public const array FEATURES = [
        'email' => 'Email alerts to you and pickup reminders to renters',
        'sms' => 'SMS texts and reminders (you load text credits)',
        'calendar_sync' => 'Google Calendar sync',
        'peak_pricing' => 'Peak and low season pricing',
        'down_payments' => 'Down payments by bank transfer',
        'inspections' => 'Pickup and return checks with photos',
        'multiple_locations' => 'Multiple pickup locations',
        'branded_email' => 'Emails from your own address',
        'remove_branding' => 'No "Powered by Rentiva" on your page',
        'featured_listing' => 'Top spot in the Rent a car directory',
        'priority_support' => 'Priority support line',
    ];

    /** Months charged for a year: two are free. */
    public const int YEARLY_MONTHS = 10;

    /**
     * Whether the plan unlocks a feature.
     */
    public function includes(string $feature): bool
    {
        return in_array($feature, $this->features ?? [], true);
    }

    /**
     * The plan's details for pricing cards: limits and every feature, on or off.
     *
     * @return array<string, mixed>
     */
    public function toCard(): array
    {
        return [
            ...$this->only(['id', 'name', 'description', 'price', 'max_cars', 'max_staff']),
            'yearly_price' => $this->yearlyPrice(),
            'features' => collect(self::FEATURES)->map(fn (string $label, string $key): array => [
                'key' => $key,
                'label' => $label,
                'included' => $this->includes($key),
            ])->values()->all(),
        ];
    }

    /**
     * The price for a year paid upfront, in centavos.
     */
    public function yearlyPrice(): int
    {
        return $this->price * self::YEARLY_MONTHS;
    }
}
