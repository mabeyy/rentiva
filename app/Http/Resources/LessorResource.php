<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Lessor details for the admin area only; never expose on public pages.
 *
 * @mixin User
 */
class LessorResource extends JsonResource
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
            'email' => $this->email,
            'phone' => $this->phone,
            'status' => $this->status->toOption(),
            'email_verified_at' => $this->email_verified_at,
            'storefront' => StorefrontResource::make($this->whenLoaded('storefront')),
            'cars_count' => $this->whenCounted('cars'),
            'bookings_count' => $this->whenCounted('bookings'),
            'created_at' => $this->created_at,
        ];
    }
}
