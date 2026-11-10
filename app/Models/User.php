<?php

namespace App\Models;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Http\Controllers\Admin\ImpersonationController;
use App\Notifications\BookingRequested;
use App\Notifications\CarPaperExpiring;
use App\Notifications\CarStatusChanged;
use App\Notifications\PaymentSubmitted;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Carbon;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property UserRole $role
 * @property UserStatus $status
 * @property string|null $phone
 * @property-read Storefront|null $storefront
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'email', 'phone', 'password'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmail, PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;

    /**
     * The model's default values for attributes.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'role' => 'lessor',
        'status' => 'active',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'role' => UserRole::class,
            'status' => UserStatus::class,
        ];
    }

    /**
     * Business emails an owner gets, sent to their booking page's
     * notification email when they set one. Account emails (password
     * resets, invoices, invitations) always go to the login email.
     *
     * @var list<class-string<Notification>>
     */
    public const array BUSINESS_NOTIFICATIONS = [
        BookingRequested::class,
        PaymentSubmitted::class,
        CarPaperExpiring::class,
        CarStatusChanged::class,
    ];

    /**
     * The address mail notifications are sent to.
     */
    public function routeNotificationForMail(?Notification $notification = null): string
    {
        if ($notification && in_array($notification::class, self::BUSINESS_NOTIFICATIONS, true)) {
            return $this->storefront?->notification_email ?: $this->email;
        }

        return $this->email;
    }

    /**
     * Questions this person sent from the Help page.
     *
     * @return HasMany<SupportRequest, $this>
     */
    public function supportRequests(): HasMany
    {
        return $this->hasMany(SupportRequest::class);
    }

    /**
     * @return HasMany<Car, $this>
     */
    public function cars(): HasMany
    {
        return $this->hasMany(Car::class, 'owner_id');
    }

    /**
     * Get the places where the lessor hands cars over.
     *
     * @return HasMany<PickupLocation, $this>
     */
    public function pickupLocations(): HasMany
    {
        return $this->hasMany(PickupLocation::class, 'owner_id');
    }

    /**
     * Get the lessor's branded booking page.
     *
     * @return HasOne<Storefront, $this>
     */
    public function storefront(): HasOne
    {
        return $this->hasOne(Storefront::class, 'owner_id');
    }

    /**
     * Get the bookings made on the user's cars.
     *
     * @return HasManyThrough<Booking, Car, $this>
     */
    public function bookings(): HasManyThrough
    {
        return $this->hasManyThrough(Booking::class, Car::class, 'owner_id');
    }

    /**
     * Limit to users who list cars.
     *
     * @param  Builder<User>  $query
     */
    #[Scope]
    protected function lessors(Builder $query): void
    {
        $query->where('role', UserRole::Lessor);
    }

    /**
     * Determine whether the user has the given role.
     */
    public function hasRole(UserRole $role): bool
    {
        return $this->role === $role;
    }

    /**
     * Determine whether the user has been suspended by an admin.
     */
    public function isSuspended(): bool
    {
        return $this->status === UserStatus::Suspended;
    }

    /**
     * The owner's peak and low seasons.
     *
     * @return HasMany<PeakSeason, $this>
     */
    public function peakSeasons(): HasMany
    {
        return $this->hasMany(PeakSeason::class, 'owner_id');
    }

    /**
     * The staff this owner has invited.
     *
     * @return HasMany<TeamMember, $this>
     */
    public function team(): HasMany
    {
        return $this->hasMany(TeamMember::class, 'owner_id');
    }

    /**
     * For a staff account: who they work for and what they may do.
     *
     * @return HasOne<TeamMember, $this>
     */
    public function teamMembership(): HasOne
    {
        return $this->hasOne(TeamMember::class);
    }

    /**
     * @return HasOne<Subscription, $this>
     */
    public function subscription(): HasOne
    {
        return $this->hasOne(Subscription::class, 'owner_id');
    }

    /**
     * @return HasMany<Invoice, $this>
     */
    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class, 'owner_id');
    }

    /**
     * Whether the owner is on a plan with Rentiva.
     */
    public function hasPlan(): bool
    {
        return $this->subscription?->plan_id !== null;
    }

    /**
     * Whether renters can book online on this owner's page: they need a plan,
     * with no invoice overdue past the grace period. An owner can set up
     * everything before picking a plan; bookings start once they do.
     */
    public function isTakingOnlineBookings(): bool
    {
        return ($this->storefront === null || $this->hasPlan()) && ! $this->isBillingPaused();
    }

    /**
     * A plan limit (max_cars or max_staff): the owner's plan's, or the
     * smallest plan's while they haven't picked one. Null means unlimited.
     */
    public function planLimit(string $limit): ?int
    {
        $plan = $this->subscription->plan ?? Plan::query()->where('is_active', true)->orderBy('price')->first();
        $current = $plan?->{$limit};

        // With a smaller plan waiting for the next period, its limit applies
        // now, so the owner can't outgrow it before it starts.
        $pending = $this->subscription?->pendingPlan?->{$limit};

        return match (true) {
            $pending === null => $current,
            $current === null => $pending,
            default => min($current, $pending),
        };
    }

    /**
     * Whether the owner's booking page has stopped taking online bookings
     * because an invoice is overdue past the grace period.
     */
    public function isBillingPaused(): bool
    {
        return $this->invoices()
            ->whereIn('status', ['unpaid', 'rejected'])
            ->whereDate('due_on', '<', today()->subDays((int) Setting::get(Setting::BillingGraceDays)))
            ->exists();
    }

    /**
     * The admin viewing the app as this owner right now, if any.
     */
    public static function impersonator(): ?self
    {
        $adminId = request()->hasSession() ? request()->session()->get(ImpersonationController::SESSION_KEY) : null;

        return $adminId ? self::query()->where('role', UserRole::Admin)->whereKey($adminId)->first() : null;
    }

    /**
     * Whether the owner's plan unlocks a feature, e.g. "sms". No plan, no extras.
     */
    public function planIncludes(string $feature): bool
    {
        return (bool) $this->subscription?->plan?->includes($feature);
    }
}
