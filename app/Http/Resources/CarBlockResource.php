<?php

namespace App\Http\Resources;

use App\Models\CarBlock;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin CarBlock
 */
class CarBlockResource extends JsonResource
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
            'start_date' => $this->start_date->toDateString(),
            'end_date' => $this->end_date->toDateString(),
            'reason' => $this->reason->toOption(),
            'note' => $this->note,
            'car' => $this->whenLoaded('car', fn (): array => [
                'id' => $this->car->id,
                'slug' => $this->car->slug,
                'name' => $this->car->name,
                'cover_image' => $this->car->coverImage?->url,
            ]),
        ];
    }
}
