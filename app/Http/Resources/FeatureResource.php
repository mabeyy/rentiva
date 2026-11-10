<?php

namespace App\Http\Resources;

use App\Models\Feature;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Feature
 */
class FeatureResource extends JsonResource
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
            'category' => $this->category->value,
            'vehicles' => $this->vehicles->value,
            'cars_count' => $this->whenCounted('cars'),
        ];
    }
}
