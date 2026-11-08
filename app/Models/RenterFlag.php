<?php

namespace App\Models;

use Database\Factories\RenterFlagFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * An owner's private warning about a renter, matched by mobile number.
 *
 * @property int $id
 * @property int $owner_id
 * @property string $phone_key Normalized mobile number, e.g. 09171234567.
 * @property string $note
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['owner_id', 'phone_key', 'note'])]
class RenterFlag extends Model
{
    /** @use HasFactory<RenterFlagFactory> */
    use HasFactory;

    /**
     * @return BelongsTo<User, $this>
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }
}
