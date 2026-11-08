<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Database\Factories\CarServiceFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One entry in a car's maintenance log.
 *
 * @property int $id
 * @property int $car_id
 * @property CarbonImmutable $serviced_on
 * @property int|null $odometer In km.
 * @property string $description
 * @property int|null $cost In centavos.
 */
#[Fillable(['serviced_on', 'odometer', 'description', 'cost'])]
class CarService extends Model
{
    /** @use HasFactory<CarServiceFactory> */
    use HasFactory;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'serviced_on' => 'immutable_date',
        ];
    }

    /**
     * @return BelongsTo<Car, $this>
     */
    public function car(): BelongsTo
    {
        return $this->belongsTo(Car::class);
    }
}
