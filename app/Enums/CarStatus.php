<?php

namespace App\Enums;

use App\Concerns\HasOptions;

enum CarStatus: string
{
    use HasOptions;

    case Draft = 'draft';
    case PendingReview = 'pending_review';
    case Active = 'active';
    case Rejected = 'rejected';
    case Suspended = 'suspended';
    case Inactive = 'inactive';

    /**
     * Get the human-readable label for the case.
     */
    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Draft',
            self::PendingReview => 'Pending review',
            self::Active => 'Active',
            self::Rejected => 'Rejected',
            self::Suspended => 'Suspended',
            self::Inactive => 'Inactive',
        };
    }

    /**
     * Determine whether the lessor may submit the listing for review.
     */
    public function isSubmittable(): bool
    {
        return in_array($this, [self::Draft, self::Rejected], true);
    }

    /**
     * Determine whether the lessor may switch the listing on or off themselves.
     * Only approved listings can, so turning one back on needs no new review.
     */
    public function isToggleable(): bool
    {
        return in_array($this, [self::Active, self::Inactive], true);
    }

    /**
     * Get the statuses an admin may set when moderating a listing.
     *
     * @return array<int, self>
     */
    public static function moderationStatuses(): array
    {
        return [self::Active, self::Rejected, self::Suspended];
    }

    /**
     * Determine whether an admin must give the lessor a reason for this status.
     */
    public function requiresReason(): bool
    {
        return in_array($this, [self::Rejected, self::Suspended], true);
    }
}
