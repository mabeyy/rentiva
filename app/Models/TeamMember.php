<?php

namespace App\Models;

use Database\Factories\TeamMemberFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
     * Whether the staff member may do the given thing.
     */
    public function can(string $permission): bool
    {
        return in_array($permission, $this->permissions, true);
    }
}
