<?php

namespace App\Http\Resources;

use App\Enums\PaymentMethod;
use App\Models\Car;
use App\Models\Storefront;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Storefront
 */
class StorefrontResource extends JsonResource
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
            'name' => $this->name,
            'slug' => $this->slug,
            'url' => route('storefronts.show', $this->resource),
            'listed_in_directory' => $this->listed_in_directory,
            'tagline' => $this->tagline,
            'about' => $this->about,
            'city' => $this->city,
            'main_pickup_location_id' => $this->main_pickup_location_id,
            'phone' => $this->phone,
            'facebook_url' => $this->facebook_url,
            'instagram_url' => $this->instagram_url,
            'tiktok_url' => $this->tiktok_url,
            'logo_url' => $this->logo_url,
            'brand_color' => $this->brand_color,
            'payment_policy' => $this->payment_policy,
            'damage_participation_fee' => $this->damage_participation_fee,
            'damage_policy' => $this->damage_policy,
            'payment_methods' => array_map(fn (PaymentMethod $method): array => $method->toOption(), $this->acceptedPaymentMethods()),
            'requires_license_photo' => $this->requires_license_photo,
            'show_platform_badge' => ! $this->owner->planIncludes('remove_branding'),
            'is_featured' => $this->when(isset($this->is_featured), fn (): bool => (bool) $this->is_featured),
            'accepting_bookings' => $this->owner->isTakingOnlineBookings(),
            'booking_rules' => [
                'min_days' => $this->min_rental_days,
                'notice_hours' => $this->advance_notice_hours,
                'max_advance_days' => $this->max_advance_days,
                'pickup_time' => $this->pickup_time,
            ],
            'peak_seasons' => ! $this->owner->planIncludes('peak_pricing') ? [] : $this->owner->peakSeasons()->upcoming()->get()
                ->map(fn ($season): array => $season->only(['rate_change']) + [
                    'start_date' => $season->start_date->toDateString(),
                    'end_date' => $season->end_date->toDateString(),
                ]),
            'pickup_locations' => PickupLocationResource::collection($this->whenLoaded('pickupLocations')),
            'vehicle_count' => $this->whenCounted('listedCars'),
            'lowest_daily_rate' => $this->whenAggregated('listedCars', 'daily_rate', 'min', fn ($rate) => (int) $rate),
            'body_types' => $this->whenLoaded('listedCars', fn () => $this->listedCars
                ->map(fn (Car $car): string => $car->body_type->label())
                ->unique()
                ->sort()
                ->values()),
        ];
    }
}
