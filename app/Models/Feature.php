<?php

namespace App\Models;

use App\Enums\FeatureCategory;
use App\Enums\FeatureVehicle;
use Database\Factories\FeatureFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * Something a car comes with, like Apple CarPlay or a helmet, grouped by
 * category and limited to the vehicles it makes sense on.
 *
 * @property int $id
 * @property string $name
 * @property FeatureCategory $category
 * @property FeatureVehicle $vehicles
 */
#[Fillable(['name', 'category', 'vehicles'])]
class Feature extends Model
{
    /** @use HasFactory<FeatureFactory> */
    use HasFactory;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'category' => FeatureCategory::class,
            'vehicles' => FeatureVehicle::class,
        ];
    }

    /**
     * @return BelongsToMany<Car, $this>
     */
    public function cars(): BelongsToMany
    {
        return $this->belongsToMany(Car::class);
    }
}
