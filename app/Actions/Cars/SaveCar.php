<?php

namespace App\Actions\Cars;

use App\Enums\CarStatus;
use App\Models\Car;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class SaveCar
{
    /**
     * Create or update a listing with its features and photos.
     *
     * @param  array<string, mixed>  $attributes  Validated car attributes; amounts are in pesos.
     * @param  array<int, int>  $featureIds
     * @param  array<int, UploadedFile>  $newImages
     * @param  array<int, int>  $removedImageIds
     */
    public function handle(Car $car, array $attributes, array $featureIds = [], array $newImages = [], array $removedImageIds = []): Car
    {
        return DB::transaction(function () use ($car, $attributes, $featureIds, $newImages, $removedImageIds): Car {
            $car->fill([
                ...$attributes,
                'daily_rate' => $this->centavos($attributes['daily_rate']),
                'security_deposit' => $this->centavos($attributes['security_deposit'] ?? null) ?? 0,
                'weekly_discount' => (int) ($attributes['weekly_discount'] ?? 0),
                'monthly_discount' => (int) ($attributes['monthly_discount'] ?? 0),
                // Blank means not offered; zero means offered for free.
                'delivery_fee' => $this->centavos($attributes['delivery_fee'] ?? null),
                'driver_daily_rate' => $this->centavos($attributes['driver_daily_rate'] ?? null),
            ]);

            if ($car->status === CarStatus::Rejected) {
                $car->status = CarStatus::Draft;
            }

            $car->save();
            $car->features()->sync($featureIds);

            $car->images()->whereKey($removedImageIds)->get()->each->delete();
            $this->storeImages($car, $newImages);

            return $car;
        });
    }

    /**
     * Store uploaded photos after the car's existing ones.
     *
     * @param  array<int, UploadedFile>  $images
     */
    private function storeImages(Car $car, array $images): void
    {
        $position = (int) $car->images()->max('position') + 1;

        foreach ($images as $image) {
            $path = $image->store("cars/{$car->slug}", 'public');

            if ($path === false) {
                throw new RuntimeException('A car photo could not be stored.');
            }

            $car->images()->create(['path' => $path, 'position' => $position++]);
        }
    }

    /**
     * Pesos from the form to centavos, keeping blank as null.
     */
    private function centavos(mixed $pesos): ?int
    {
        return $pesos === null || $pesos === '' ? null : (int) round((float) $pesos * 100);
    }
}
