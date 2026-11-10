<?php

namespace App\Models;

use App\Enums\PaymentMethod;
use App\Enums\RenterCancellation;
use App\Enums\UserStatus;
use Database\Factories\StorefrontFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\RouteKey;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * A lessor's own branded booking page, served at /{slug}.
 *
 * @property int $id
 * @property int $owner_id
 * @property string $name
 * @property string $slug
 * @property bool $listed_in_directory
 * @property bool $accepts_pay_at_pickup
 * @property bool $accepts_bank_transfer
 * @property int $transfer_deadline_minutes Minutes a renter has to transfer after the owner confirms.
 * @property int|null $proof_retention_days Admin-set override of the platform's screenshot retention, in days.
 * @property string|null $payment_policy Shown to renters, who agree to it when booking.
 * @property RenterCancellation $renter_cancellation Whether renters may cancel a confirmed booking themselves.
 * @property int $cancellation_notice_hours With notice: online cancelling closes this many hours before the pickup date.
 * @property bool $down_payment_enabled Ask bank transfer renters for a down payment instead of the full amount.
 * @property int $down_payment_percent
 * @property int $min_rental_days
 * @property int $advance_notice_hours How long before pickup renters must book.
 * @property int $max_advance_days How far ahead renters can book.
 * @property int $default_weekly_discount Percent off 7+ day rentals, for cars without their own.
 * @property int $default_monthly_discount Percent off 28+ day rentals, for cars without their own.
 * @property int|null $default_delivery_fee In centavos; null when cars aren't delivered.
 * @property int|null $default_driver_daily_rate In centavos per day; null when no driver is offered.
 * @property int $default_deposit_percent Security deposit as a percent of the rental.
 * @property int|null $damage_participation_fee In centavos: what the renter pays first if the car is damaged, like an insurance participation fee.
 * @property string|null $damage_policy The owner's damage terms, which renters agree to when booking.
 * @property bool $requires_license_photo Whether renters must upload a license photo to book.
 * @property int|null $data_retention_months Admin-set override of the platform's renter-details retention, in months.
 * @property string|null $resend_api_key Encrypted; sends renter emails from the owner's own domain.
 * @property string|null $mail_from_address
 * @property string|null $semaphore_api_key Encrypted; the owner's own SMS account.
 * @property string|null $sms_sender_name
 * @property bool $sms_enabled
 * @property string|null $google_calendar_id
 * @property string|null $google_client_email
 * @property string|null $google_private_key Encrypted service-account key.
 * @property bool $google_calendar_enabled
 * @property string $pickup_time Usual pickup time (HH:MM, Philippine time); reminders count back from it.
 * @property bool $remind_email_24h
 * @property bool $remind_email_2h
 * @property bool $remind_sms_24h
 * @property bool $remind_sms_2h
 * @property string|null $tagline
 * @property string|null $about
 * @property string|null $city Copied from the main pickup location, for the directory's city filter.
 * @property int|null $main_pickup_location_id
 * @property string|null $phone
 * @property string|null $notification_email Where booking emails for the owner go, instead of their login email.
 * @property string|null $facebook_url
 * @property string|null $instagram_url
 * @property string|null $tiktok_url
 * @property string|null $logo_path
 * @property string|null $brand_color Hex color such as #E8622A, or null for the default.
 * @property-read string|null $logo_url
 * @property-read bool|null $is_featured Set by the directory listing.
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[RouteKey('slug')]
#[Fillable(['name', 'slug', 'listed_in_directory', 'tagline', 'about', 'city', 'main_pickup_location_id', 'phone', 'notification_email', 'facebook_url', 'instagram_url', 'tiktok_url', 'logo_path', 'brand_color', 'accepts_pay_at_pickup', 'accepts_bank_transfer', 'transfer_deadline_minutes', 'proof_retention_days', 'payment_policy', 'renter_cancellation', 'cancellation_notice_hours', 'data_retention_months', 'resend_api_key', 'mail_from_address', 'semaphore_api_key', 'sms_sender_name', 'sms_enabled', 'google_calendar_id', 'google_client_email', 'google_private_key', 'google_calendar_enabled', 'pickup_time', 'remind_email_24h', 'remind_email_2h', 'remind_sms_24h', 'remind_sms_2h', 'requires_license_photo', 'down_payment_enabled', 'down_payment_percent', 'min_rental_days', 'advance_notice_hours', 'max_advance_days', 'default_weekly_discount', 'default_monthly_discount', 'default_delivery_fee', 'default_driver_daily_rate', 'default_deposit_percent', 'damage_participation_fee', 'damage_policy'])]
class Storefront extends Model
{
    /** @use HasFactory<StorefrontFactory> */
    use HasFactory;

    /**
     * Integration secrets never leave the server.
     *
     * @var list<string>
     */
    protected $hidden = ['resend_api_key', 'semaphore_api_key', 'google_private_key'];

    /**
     * The model's default values for attributes.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'listed_in_directory' => true,
        'accepts_pay_at_pickup' => true,
        'accepts_bank_transfer' => false,
        // Starting long-stay discounts for a new business; owners can change them.
        'default_weekly_discount' => 10,
        'default_monthly_discount' => 20,
    ];

    /**
     * Car fields that follow the business defaults unless a car has its own.
     *
     * @var list<string>
     */
    public const array EXTRAS = ['weekly_discount', 'monthly_discount', 'delivery_fee', 'driver_daily_rate', 'deposit_percent'];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'listed_in_directory' => 'boolean',
            'accepts_pay_at_pickup' => 'boolean',
            'accepts_bank_transfer' => 'boolean',
            'transfer_deadline_minutes' => 'integer',
            'proof_retention_days' => 'integer',
            'renter_cancellation' => RenterCancellation::class,
            'cancellation_notice_hours' => 'integer',
            'data_retention_months' => 'integer',
            'requires_license_photo' => 'boolean',
            'down_payment_enabled' => 'boolean',
            'down_payment_percent' => 'integer',
            'min_rental_days' => 'integer',
            'advance_notice_hours' => 'integer',
            'max_advance_days' => 'integer',
            'default_weekly_discount' => 'integer',
            'default_monthly_discount' => 'integer',
            'default_delivery_fee' => 'integer',
            'default_driver_daily_rate' => 'integer',
            'default_deposit_percent' => 'integer',
            'damage_participation_fee' => 'integer',
            'resend_api_key' => 'encrypted',
            'semaphore_api_key' => 'encrypted',
            'sms_enabled' => 'boolean',
            'google_private_key' => 'encrypted',
            'google_calendar_enabled' => 'boolean',
            'remind_email_24h' => 'boolean',
            'remind_email_2h' => 'boolean',
            'remind_sms_24h' => 'boolean',
            'remind_sms_2h' => 'boolean',
        ];
    }

    /**
     * The payment methods renters may choose when booking with this owner.
     *
     * @return array<int, PaymentMethod>
     */
    public function acceptedPaymentMethods(): array
    {
        return array_values(array_filter([
            $this->accepts_pay_at_pickup ? PaymentMethod::PayAtPickup : null,
            $this->accepts_bank_transfer ? PaymentMethod::BankTransfer : null,
        ]));
    }

    /**
     * The business-wide discounts, extras and deposit, keyed by car field.
     *
     * @return array{weekly_discount: int, monthly_discount: int, delivery_fee: int|null, driver_daily_rate: int|null, deposit_percent: int}
     */
    public function defaultExtras(): array
    {
        return [
            'weekly_discount' => (int) $this->default_weekly_discount,
            'monthly_discount' => (int) $this->default_monthly_discount,
            'delivery_fee' => $this->default_delivery_fee,
            'driver_daily_rate' => $this->default_driver_daily_rate,
            'deposit_percent' => (int) $this->default_deposit_percent,
        ];
    }

    /**
     * Copy the defaults onto every car that follows them, so prices
     * everywhere read straight from the car.
     */
    public function applyDefaultExtrasToCars(): void
    {
        $this->owner->cars()->where('custom_extras', false)->update($this->defaultExtras());
    }

    /**
     * Get the public URL of the logo, if one was uploaded.
     *
     * @return Attribute<string|null, never>
     */
    protected function logoUrl(): Attribute
    {
        return Attribute::get(fn (): ?string => $this->logo_path ? Storage::disk('public')->url($this->logo_path) : null);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * Get every car the storefront's owner has listed, in any status.
     *
     * @return HasMany<Car, $this>
     */
    public function cars(): HasMany
    {
        return $this->hasMany(Car::class, 'owner_id', 'owner_id');
    }

    /**
     * Get the storefront's cars that renters can book.
     *
     * @return HasMany<Car, $this>
     */
    public function listedCars(): HasMany
    {
        return $this->cars()->listed();
    }

    /**
     * Get the pickup location the owner marked as main; it sets the storefront's city.
     *
     * @return BelongsTo<PickupLocation, $this>
     */
    public function mainPickupLocation(): BelongsTo
    {
        return $this->belongsTo(PickupLocation::class, 'main_pickup_location_id');
    }

    /**
     * Get the accounts renters may transfer to, in the owner's order.
     *
     * @return HasMany<PaymentAccount, $this>
     */
    public function paymentAccounts(): HasMany
    {
        return $this->hasMany(PaymentAccount::class)->orderBy('position');
    }

    /**
     * Get the owner's pickup locations, shown on their booking page.
     *
     * @return HasMany<PickupLocation, $this>
     */
    public function pickupLocations(): HasMany
    {
        return $this->hasMany(PickupLocation::class, 'owner_id', 'owner_id')->orderBy('id');
    }

    /**
     * Get the renters' reviews of every car the storefront's owner rents out.
     *
     * @return HasManyThrough<Review, Car, $this>
     */
    public function reviews(): HasManyThrough
    {
        // Reviews an admin hid stay off public pages and averages.
        return $this->hasManyThrough(Review::class, Car::class, 'owner_id', 'car_id', 'owner_id', 'id')->whereNull('reviews.hidden_at');
    }

    /**
     * Limit to storefronts shown in the renter directory: opted in, owner active,
     * and at least one bookable car.
     *
     * @param  Builder<Storefront>  $query
     */
    #[Scope]
    protected function inDirectory(Builder $query): void
    {
        $query->where('listed_in_directory', true)
            ->whereHas('owner', fn (Builder $owner) => $owner->where('status', UserStatus::Active))
            ->whereHas('cars', fn (Builder $cars) => $cars->listed());
    }

    /**
     * Determine whether the storefront may be shown to renters.
     */
    public function isOpen(): bool
    {
        return $this->owner->status === UserStatus::Active;
    }

    /**
     * Words a storefront may never use as its address because the app needs them.
     *
     * @var array<int, string>
     */
    private const array EXTRA_RESERVED_SLUGS = ['api', 'about', 'help', 'contact', 'terms', 'privacy'];

    /**
     * Determine whether a slug would collide with one of the app's own top-level paths.
     * Storefronts live at /{slug}, so "cars", "login", "admin"… must stay unavailable.
     */
    public static function isReservedSlug(string $slug): bool
    {
        $appSegments = collect(Route::getRoutes()->getRoutes())
            ->map(fn ($route): string => Str::before($route->uri(), '/'))
            ->filter(fn (string $segment): bool => $segment !== '' && ! str_starts_with($segment, '{'));

        return $appSegments->contains($slug) || in_array($slug, self::EXTRA_RESERVED_SLUGS, true);
    }

    /**
     * Build a slug from a business name that no other storefront or app page uses.
     */
    public static function uniqueSlugFor(string $name): string
    {
        $base = Str::slug($name) ?: 'rental';
        $slug = $base;

        for ($suffix = 2; self::where('slug', $slug)->exists() || self::isReservedSlug($slug); $suffix++) {
            $slug = "{$base}-{$suffix}";
        }

        return $slug;
    }

    /**
     * Months after a trip that renter details are kept: the admin's override
     * for this owner, or the platform's period.
     */
    public function dataRetentionMonths(): int
    {
        return $this->data_retention_months ?? (int) Setting::get(Setting::DataRetentionMonths);
    }

    /**
     * Days after a trip that checked transfer screenshots are kept: the
     * admin's override for this owner, or the platform's period.
     */
    public function proofRetentionDays(): int
    {
        return $this->proof_retention_days ?? (int) Setting::get(Setting::ProofRetentionDays);
    }
}
