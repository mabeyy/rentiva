<?php

namespace App\Http\Resources;

use App\Models\Car;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Car
 */
class CarResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'name' => $this->name,
            'make' => $this->make,
            'model' => $this->model,
            'year' => $this->year,
            'body_type' => $this->body_type->toOption(),
            'transmission' => $this->transmission->toOption(),
            'fuel_type' => $this->fuel_type->toOption(),
            'drivetrain' => $this->drivetrain?->toOption(),
            'seats' => $this->seats,
            'doors' => $this->doors,
            'luggage_capacity' => $this->luggage_capacity,
            'fuel_economy_city' => $this->fuel_economy_city,
            'fuel_economy_highway' => $this->fuel_economy_highway,
            'exterior_color' => $this->exterior_color,
            'location' => $this->pickupLocation?->city,
            'pickup_location' => PickupLocationResource::make($this->whenLoaded('pickupLocation')),
            'description' => $this->description,
            'daily_rate' => $this->daily_rate,
            'deposit_percent' => $this->deposit_percent,
            'custom_extras' => $this->custom_extras,
            'weekly_discount' => $this->weekly_discount,
            'monthly_discount' => $this->monthly_discount,
            'delivery_fee' => $this->delivery_fee,
            'driver_daily_rate' => $this->driver_daily_rate,
            'plate_number' => $this->plate_number,
            'registration_expires_on' => $this->registration_expires_on?->toDateString(),
            'status' => $this->status->toOption(),
            'rejection_reason' => $this->rejection_reason,
            'host_name' => $this->whenLoaded('owner', fn () => $this->owner->relationLoaded('storefront') && $this->owner->storefront
                ? $this->owner->storefront->name
                : $this->owner->name),
            'storefront_slug' => $this->whenLoaded('owner', fn () => $this->owner->relationLoaded('storefront')
                ? $this->owner->storefront?->slug
                : null),
            'cover_image' => CarImageResource::make($this->whenLoaded('coverImage')),
            'images' => CarImageResource::collection($this->whenLoaded('images')),
            'features' => FeatureResource::collection($this->whenLoaded('features')),
            'bookings_count' => $this->whenCounted('bookings'),
            'created_at' => $this->created_at,
        ];
    }
}
