<?php

namespace App\Models;

use App\Http\Requests\Lessor\StoreSupportRequestRequest;
use Carbon\CarbonImmutable;
use Database\Factories\SupportRequestFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * A question an owner or staff member sent from the Help page. Admins see
 * it in the admin area and reply by email.
 *
 * @property int $id
 * @property int $user_id
 * @property string $topic A key of StoreSupportRequestRequest::TOPICS.
 * @property string|null $reference A booking reference or car, if given.
 * @property string $message
 * @property string|null $screenshot_path On the local disk; removed once resolved.
 * @property CarbonImmutable|null $resolved_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read User $user
 */
#[Fillable(['topic', 'reference', 'message', 'screenshot_path'])]
class SupportRequest extends Model
{
    /** @use HasFactory<SupportRequestFactory> */
    use HasFactory;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'resolved_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * e.g. "Bookings and payments".
     */
    public function topicLabel(): string
    {
        return StoreSupportRequestRequest::TOPICS[$this->topic] ?? $this->topic;
    }

    /**
     * The business the sender works for: their own, or their owner's.
     */
    public function businessName(): ?string
    {
        return $this->user->storefront->name ?? $this->user->teamMembership?->owner?->storefront?->name;
    }
}
