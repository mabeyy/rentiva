<?php

namespace App\Models;

use Database\Factories\TeamMemberFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Notifications\DatabaseNotification;

/**
 * A staff account working for an owner, with what it may do.
 *
 * @property int $id
 * @property int $owner_id
 * @property int $user_id
 * @property array<int, string> $permissions Any of PERMISSIONS.
 */
#[Fillable(['owner_id', 'user_id', 'permissions'])]
class TeamMember extends Model
{
    /** @use HasFactory<TeamMemberFactory> */
    use HasFactory;

    /** What an owner can let staff do, with a label for each. */
    public const array PERMISSIONS = [
        'bookings' => 'Bookings and calendar',
        'cars' => 'Cars, blocked dates and pickup locations',
        'payments' => 'Checking transfers and recording payments',
        'customers' => 'Renters and reviews',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'permissions' => 'array',
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
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * The staff member making the current request, if it's one.
     */
    public static function acting(): ?User
    {
        $staff = request()->attributes->get('staff');

        return $staff instanceof User ? $staff : null;
    }

    /**
     * Whether whoever is making the request may do the given thing: owners
     * always, staff only with that permission.
     */
    public static function actingCan(string $permission): bool
    {
        $membership = request()->attributes->get('staffMembership');

        return ! $membership instanceof self || $membership->can($permission);
    }

    /**
     * Which alerts in the owner's bell each permission shows staff. Billing
     * alerts aren't here: they stay with the owner.
     *
     * @var array<string, list<string>>
     */
    public const array ALERTS_BY_PERMISSION = [
        'bookings' => ['requested', 'added', 'confirmed', 'declined', 'cancelled', 'completed', 'changed', 'change_requested', 'change_withdrawn'],
        'payments' => ['payment_submitted'],
        'customers' => ['reviewed'],
        'cars' => ['paper_expiring'],
    ];

    /**
     * The alert actions the person making the request may see, or null for
     * all of them (the owner).
     *
     * @return list<string>|null
     */
    public static function visibleAlertActions(): ?array
    {
        $membership = request()->attributes->get('staffMembership');

        if (! $membership instanceof self) {
            return null;
        }

        return array_values(collect($membership->permissions)
            ->flatMap(fn (string $permission): array => self::ALERTS_BY_PERMISSION[$permission] ?? [])
            ->unique()->all());
    }

    /**
     * Limit a notifications query to the given alert actions. Matches the
     * stored JSON text, so it works on SQLite, MySQL and Postgres alike
     * (the column is text, which Postgres can't read with JSON operators).
     *
     * @param  MorphMany<DatabaseNotification, User>  $query
     * @param  list<string>|null  $actions  Null leaves the query as it is.
     * @return MorphMany<DatabaseNotification, User>
     */
    public static function onlyAlerts(MorphMany $query, ?array $actions): MorphMany
    {
        if ($actions === null) {
            return $query;
        }

        $query->where(function ($inner) use ($actions): void {
            $inner->whereRaw('1 = 0');

            foreach ($actions as $action) {
                $inner->orWhere('data', 'like', '%"action":"'.$action.'"%');
            }
        });

        return $query;
    }

    /**
     * Whether the staff member may do the given thing.
     */
    public function can(string $permission): bool
    {
        return in_array($permission, $this->permissions, true);
    }
}
