<?php

namespace App\Models;

use Database\Factories\PickupLocationFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * A place where a lessor hands cars over, e.g. their main branch or an airport.
 *
 * @property int $id
 * @property int $owner_id
 * @property string $address Street address.
 * @property string $city
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['address', 'city'])]
class PickupLocation extends Model
{
    /** @use HasFactory<PickupLocationFactory> */
    use HasFactory;

    /**
     * Keep the owner's storefront city in step with their main location, and
     * make an owner's first location their main one.
     */
    protected static function booted(): void
    {
        static::saved(function (PickupLocation $location): void {
            Storefront::where('owner_id', $location->owner_id)
                ->whereNull('main_pickup_location_id')
                ->update(['main_pickup_location_id' => $location->id]);

            Storefront::where('main_pickup_location_id', $location->id)
                ->update(['city' => $location->city]);
        });
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * @return HasMany<Car, $this>
     */
    public function cars(): HasMany
    {
        return $this->hasMany(Car::class);
    }

    /**
     * Whether this is the main location of its owner's storefront.
     */
    public function isMain(): bool
    {
        return Storefront::where('main_pickup_location_id', $this->id)->exists();
    }
}
