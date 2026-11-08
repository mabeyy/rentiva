<?php

namespace App\Http\Resources;

use App\Models\PickupLocation;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin PickupLocation
 */
class PickupLocationResource extends JsonResource
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
            'address' => $this->address,
            'city' => $this->city,
            'cars_count' => $this->whenCounted('cars'),
        ];
    }
}
