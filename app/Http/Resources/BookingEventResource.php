<?php

namespace App\Http\Resources;

use App\Models\BookingEvent;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin BookingEvent
 */
class BookingEventResource extends JsonResource
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
            'action' => $this->action,
            'actor_type' => $this->actor_type,
            'actor_name' => $this->actor_name,
            'description' => $this->description,
            'created_at' => $this->created_at?->toIso8601String(),
            'reference' => $this->booking?->reference,
            'renter_name' => $this->booking?->renter_name,
            'car_name' => $this->subjectCar()?->name,
            'owner_name' => $this->when(
                (bool) $this->subjectCar()?->relationLoaded('owner'),
                fn (): ?string => $this->subjectCar()->owner?->storefront->name ?? $this->subjectCar()->owner?->name,
            ),
        ];
    }
}
