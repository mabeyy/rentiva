<?php

namespace App\Actions\Cars;

use App\Actions\Images\StoreOptimizedImage;
use App\Enums\CarStatus;
use App\Models\Car;
use App\Models\Storefront;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

class SaveCar
{
    /** Changing any of these on an approved car sends it back for review. */
    public const array IDENTITY_FIELDS = ['make', 'model', 'year', 'body_type', 'plate_number'];

    public function __construct(private readonly StoreOptimizedImage $storeOptimizedImage) {}

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
            $hasOwnExtras = (bool) ($attributes['custom_extras'] ?? false);

            $car->fill([
                ...$attributes,
                'daily_rate' => $this->centavos($attributes['daily_rate']),
                'custom_extras' => $hasOwnExtras,
                ...($hasOwnExtras ? [
                    'weekly_discount' => (int) ($attributes['weekly_discount'] ?? 0),
                    'monthly_discount' => (int) ($attributes['monthly_discount'] ?? 0),
                    // Blank means not offered; zero means offered for free.
                    'delivery_fee' => $this->centavos($attributes['delivery_fee'] ?? null),
                    'driver_daily_rate' => $this->centavos($attributes['driver_daily_rate'] ?? null),
                    'deposit_percent' => (int) ($attributes['deposit_percent'] ?? 0),
                ] : $this->businessDefaults($car)),
            ]);

            if ($car->status === CarStatus::Rejected) {
                $car->status = CarStatus::Draft;
            }

            // An approved listing (live, or switched off for now) that becomes a
            // different vehicle goes back for review; price, photo and
            // description changes don't.
            if (in_array($car->status, [CarStatus::Active, CarStatus::Inactive], true) && $car->isDirty(self::IDENTITY_FIELDS)) {
                $car->status = CarStatus::PendingReview;
            }

            // A new registration date gets its reminders again.
            if ($car->isDirty('registration_expires_on')) {
                $car->registration_reminded_at_days = null;
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
            $path = $this->storeOptimizedImage->handle($image, "cars/{$car->slug}", 'public');

            $car->images()->create(['path' => $path, 'position' => $position++]);
        }
    }

    /**
     * The owner's business-wide discounts, extras and deposit, for a car
     * that follows them.
     *
     * @return array<string, int|null>
     */
    private function businessDefaults(Car $car): array
    {
        return ($car->owner->storefront ?? new Storefront)->defaultExtras();
    }

    /**
     * Pesos from the form to centavos, keeping blank as null.
     */
    private function centavos(mixed $pesos): ?int
    {
        return $pesos === null || $pesos === '' ? null : (int) round((float) $pesos * 100);
    }
}
