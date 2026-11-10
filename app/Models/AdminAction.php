<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;

/**
 * Something an admin did, kept for the record: who, what, to which owner,
 * listing, invoice or review, and when.
 *
 * @property int $id
 * @property int|null $admin_id
 * @property string $admin_name Kept if the admin's account is deleted.
 * @property string $action A key of self::ACTIONS.
 * @property string|null $subject_type
 * @property int|null $subject_id
 * @property string|null $subject_label e.g. the business or invoice number, kept if it's deleted.
 * @property string|null $details
 * @property Carbon|null $created_at
 */
#[Fillable(['admin_id', 'admin_name', 'action', 'subject_type', 'subject_id', 'subject_label', 'details'])]
class AdminAction extends Model
{
    public const UPDATED_AT = null;

    /** What admins can do, with a label for each. */
    public const array ACTIONS = [
        'plan_changed' => 'Changed an owner\'s plan',
        'owner_suspended' => 'Suspended an owner',
        'owner_reinstated' => 'Reinstated an owner',
        'retention_changed' => 'Changed data retention',
        'listing_approved' => 'Approved a listing',
        'listing_rejected' => 'Rejected a listing',
        'listing_suspended' => 'Suspended a listing',
        'invoice_paid' => 'Marked an invoice paid',
        'invoice_rejected' => 'Sent a payment back',
        'invoice_cancelled' => 'Cancelled an invoice',
        'payment_accounts_changed' => 'Changed Rentiva\'s payment accounts',
        'grace_changed' => 'Changed the grace period',
        'review_hidden' => 'Hid a review',
        'review_kept' => 'Kept a reported review',
        'review_shown' => 'Showed a review again',
        'impersonation_started' => 'Started viewing as an owner',
        'impersonation_ended' => 'Stopped viewing as an owner',
        'plan_saved' => 'Saved a plan',
        'settings_changed' => 'Changed platform settings',
    ];

    /**
     * Record what the signed-in admin (or the admin viewing as an owner) did.
     */
    public static function record(?Model $subject, string $action, ?string $details = null): self
    {
        $admin = User::impersonator() ?? Auth::user();

        return self::query()->create([
            'admin_id' => $admin?->id,
            'admin_name' => $admin->name ?? __('System'),
            'action' => $action,
            'subject_type' => $subject?->getMorphClass(),
            'subject_id' => $subject?->getKey(),
            'subject_label' => $subject ? self::labelFor($subject) : null,
            'details' => $details !== null ? mb_substr($details, 0, 255) : null,
        ]);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    /**
     * @return MorphTo<Model, $this>
     */
    public function subject(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * A name for the thing acted on that still makes sense if it's deleted.
     */
    private static function labelFor(Model $subject): string
    {
        return match (true) {
            $subject instanceof User => $subject->storefront->name ?? $subject->name,
            $subject instanceof Car => $subject->name.' ('.($subject->owner->storefront->name ?? $subject->owner->name).')',
            $subject instanceof Invoice => $subject->number,
            $subject instanceof Review => __('Review on :car', ['car' => $subject->car->name]),
            $subject instanceof Plan => $subject->name,
            default => class_basename($subject).' #'.$subject->getKey(),
        };
    }
}
