<?php

namespace App\Models;

use App\Enums\BodyType;
use App\Enums\CarStatus;
use App\Enums\Drivetrain;
use App\Enums\FuelType;
use App\Enums\Transmission;
use App\Enums\UserStatus;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Database\Factories\CarFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\RouteKey;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property int $owner_id
 * @property string $slug
 * @property string $make
 * @property string $model
 * @property int $year
 * @property BodyType $body_type
 * @property Transmission $transmission
 * @property FuelType $fuel_type
 * @property Drivetrain|null $drivetrain Null for two-wheelers.
 * @property int $seats
 * @property int|null $doors Null for two-wheelers.
 * @property int $luggage_capacity
 * @property float|null $fuel_economy_city
 * @property float|null $fuel_economy_highway
 * @property string $exterior_color
 * @property int|null $pickup_location_id
 * @property string|null $description
 * @property int $daily_rate Daily rate in centavos.
 * @property int $deposit_percent Refundable deposit as a percent of the rental, collected at pickup.
 * @property bool $custom_extras Whether the car has its own discounts, extras and deposit instead of the business defaults.
 * @property int $weekly_discount Percent off rentals of 7 days or more.
 * @property int $monthly_discount Percent off rentals of 28 days or more.
 * @property int|null $delivery_fee In centavos; null when the car isn't delivered.
 * @property int|null $driver_daily_rate In centavos per day; null when no driver is offered.
 * @property string|null $plate_number
 * @property CarbonImmutable|null $registration_expires_on
 * @property CarStatus $status
 * @property string|null $rejection_reason
 * @property-read string $name
 * @property-read int|null $reviews_count Set by withCount('reviews').
 * @property-read float|string|null $reviews_avg_rating Set by withAvg('reviews', 'rating').
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[RouteKey('slug')]
#[Fillable([
    'make', 'model', 'year', 'body_type', 'transmission', 'fuel_type', 'drivetrain',
    'seats', 'doors', 'luggage_capacity', 'fuel_economy_city', 'fuel_economy_highway',
    'exterior_color', 'pickup_location_id', 'description', 'daily_rate', 'status', 'rejection_reason',
    'deposit_percent', 'custom_extras', 'weekly_discount', 'monthly_discount', 'delivery_fee', 'driver_daily_rate',
    'plate_number', 'registration_expires_on',
])]
class Car extends Model
{
    /** @use HasFactory<CarFactory> */
    use HasFactory;

    /**
     * Relations every car needs to render: its pickup location is shown wherever the car is.
     *
     * @var list<string>
     */
    protected $with = ['pickupLocation'];

    /**
     * The model's default values for attributes.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'status' => 'draft',
        'custom_extras' => false,
        'deposit_percent' => 0,
        'weekly_discount' => 0,
        'monthly_discount' => 0,
    ];

    /**
     * Generate a unique slug when the car is first created.
     */
    protected static function booted(): void
    {
        static::creating(function (Car $car): void {
            $car->slug ??= Str::slug("{$car->year} {$car->make} {$car->model}").'-'.Str::lower(Str::random(6));
        });
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'body_type' => BodyType::class,
            'transmission' => Transmission::class,
            'fuel_type' => FuelType::class,
            'drivetrain' => Drivetrain::class,
            'status' => CarStatus::class,
            'custom_extras' => 'boolean',
            'fuel_economy_city' => 'float',
            'fuel_economy_highway' => 'float',
            'registration_expires_on' => 'immutable_date',
        ];
    }

    /**
     * Get the display name, e.g. "2024 Toyota Vios".
     *
     * @return Attribute<covariant string, never>
     */
    protected function name(): Attribute
    {
        return Attribute::get(fn (): string => "{$this->year} {$this->make} {$this->model}");
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * Get where renters pick the car up.
     *
     * @return BelongsTo<PickupLocation, $this>
     */
    public function pickupLocation(): BelongsTo
    {
        return $this->belongsTo(PickupLocation::class);
    }

    /**
     * @return HasMany<CarImage, $this>
     */
    public function images(): HasMany
    {
        return $this->hasMany(CarImage::class)->orderBy('position');
    }

    /**
     * @return HasOne<CarImage, $this>
     */
    public function coverImage(): HasOne
    {
        return $this->hasOne(CarImage::class)->ofMany('position', 'min');
    }

    /**
     * @return BelongsToMany<Feature, $this>
     */
    public function features(): BelongsToMany
    {
        return $this->belongsToMany(Feature::class)->orderBy('name');
    }

    /**
     * @return HasMany<Booking, $this>
     */
    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    /**
     * The car's maintenance log, newest first.
     *
     * @return HasMany<CarService, $this>
     */
    public function services(): HasMany
    {
        return $this->hasMany(CarService::class)->latest('serviced_on');
    }

    /**
     * @return HasMany<Review, $this>
     */
    public function reviews(): HasMany
    {
        // Reviews an admin hid stay off public pages and averages.
        return $this->hasMany(Review::class)->whereNull('reviews.hidden_at');
    }

    /**
     * Activity log entries about the car itself, like blocked dates.
     *
     * @return HasMany<BookingEvent, $this>
     */
    public function events(): HasMany
    {
        return $this->hasMany(BookingEvent::class);
    }

    /**
     * Log something done to the car by the signed-in owner or admin.
     */
    public function recordEvent(string $action, ?string $description = null): BookingEvent
    {
        $user = Auth::user();
        $staff = TeamMember::acting();
        $impersonator = User::impersonator();

        return $this->events()->create([
            'action' => $action,
            'actor_type' => match (true) {
                $impersonator !== null => 'admin',
                $staff !== null => 'staff',
                $user?->id === $this->owner_id => 'owner',
                default => 'admin',
            },
            'actor_name' => $impersonator->name ?? $staff->name ?? $user->name ?? config('app.name'),
            'description' => $description,
        ]);
    }

    /**
     * @return HasMany<CarBlock, $this>
     */
    public function blocks(): HasMany
    {
        return $this->hasMany(CarBlock::class);
    }

    /**
     * Limit to listings renters may browse and book.
     *
     * @param  Builder<Car>  $query
     */
    #[Scope]
    protected function listed(Builder $query): void
    {
        $query->where('status', CarStatus::Active)
            ->whereHas('owner', fn (Builder $owner) => $owner->where('status', UserStatus::Active));
    }

    /**
     * Limit to cars with no reserving booking or blocked day overlapping the given dates.
     *
     * @param  Builder<Car>  $query
     */
    #[Scope]
    protected function availableBetween(Builder $query, CarbonInterface $startDate, CarbonInterface $endDate): void
    {
        $query->whereDoesntHave('bookings', fn (Builder $bookings) => $bookings->reserving()->overlapping($startDate, $endDate))
            ->whereDoesntHave('blocks', fn (Builder $blocks) => $blocks->overlappingRental($startDate, $endDate));
    }

    /**
     * Apply the public catalog's search filters and sorting.
     *
     * @param  Builder<Car>  $query
     * @param  array{search?: string, body_type?: string, transmission?: string, fuel_type?: string, seats?: int, location?: string, max_rate?: int, start_date?: string, end_date?: string, sort?: string}  $filters
     */
    #[Scope]
    protected function filter(Builder $query, array $filters): void
    {
        $query
            ->when($filters['search'] ?? null, fn (Builder $query, string $search) => $query->where(
                fn (Builder $query) => $query->whereLike('make', "%{$search}%")->orWhereLike('model', "%{$search}%"),
            ))
            ->when($filters['body_type'] ?? null, fn (Builder $query, string $type) => $query->where('body_type', $type))
            ->when($filters['transmission'] ?? null, fn (Builder $query, string $type) => $query->where('transmission', $type))
            ->when($filters['fuel_type'] ?? null, fn (Builder $query, string $type) => $query->where('fuel_type', $type))
            ->when($filters['seats'] ?? null, fn (Builder $query, int $seats) => $query->where('seats', '>=', $seats))
            ->when($filters['location'] ?? null, fn (Builder $query, string $city) => $query->whereRelation('pickupLocation', 'city', $city))
            ->when($filters['max_rate'] ?? null, fn (Builder $query, int $rate) => $query->where('daily_rate', '<=', $rate * 100));

        if (isset($filters['start_date'], $filters['end_date'])) {
            $query->availableBetween(Carbon::parse($filters['start_date']), Carbon::parse($filters['end_date']));
        }

        match ($filters['sort'] ?? null) {
            'price_asc' => $query->orderBy('daily_rate'),
            'price_desc' => $query->orderByDesc('daily_rate'),
            default => $query->latest(),
        };
    }

    /**
     * Get the reserved and blocked date ranges that have not ended yet, for
     * the booking calendar. Renters see both simply as unavailable.
     *
     * @return array<int, array{start_date: string, end_date: string}>
     */
    public function upcomingBookedRanges(?Booking $except = null): array
    {
        return $this->bookings()
            ->reserving()
            ->when($except, fn ($query, Booking $booking) => $query->whereKeyNot($booking->getKey()))
            ->whereDate('end_date', '>', today())
            ->orderBy('start_date')
            ->get(['start_date', 'end_date'])
            ->map(fn (Booking $booking): array => [
                'start_date' => $booking->start_date->toDateString(),
                'end_date' => $booking->end_date->toDateString(),
            ])
            ->concat($this->blocks()->upcoming()->get()->map(fn (CarBlock $block): array => $block->asRentalRange()))
            ->sortBy('start_date')
            ->values()
            ->all();
    }

    /**
     * Determine whether renters can currently book this car.
     */
    public function isListed(): bool
    {
        return $this->status === CarStatus::Active && $this->owner->status === UserStatus::Active;
    }

    /**
     * Determine whether the owner has blocked any day of the given rental.
     */
    public function isBlockedBetween(CarbonInterface $startDate, CarbonInterface $endDate): bool
    {
        return $this->blocks()->overlappingRental($startDate, $endDate)->exists();
    }

    /**
     * Determine whether the car's dates are free of other bookings for the given range.
     */
    public function isAvailableBetween(CarbonInterface $startDate, CarbonInterface $endDate, ?Booking $except = null): bool
    {
        return ! $this->bookings()->reserving()->overlapping($startDate, $endDate)
            ->when($except, fn (Builder $query) => $query->whereKeyNot($except->getKey()))
            ->exists();
    }
}
