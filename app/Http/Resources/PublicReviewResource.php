<?php

namespace App\Http\Resources;

use App\Models\Booking;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A written review as renters see it on a booking page, with the renter
 * shown as first name and last initial, and the owner's reply.
 *
 * @mixin Review
 */
class PublicReviewResource extends JsonResource
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
            'rating' => $this->rating,
            'comment' => $this->comment,
            'owner_reply' => $this->owner_reply,
            'car_name' => $this->car->name,
            'renter' => self::publicName($this->booking),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }

    /**
     * e.g. "Juan D." — never the full name in public.
     */
    public static function publicName(Booking $booking): string
    {
        if ($booking->anonymized_at) {
            return __('A renter');
        }

        $parts = preg_split('/\s+/', trim($booking->renter_name)) ?: [];
        $first = $parts[0] ?? __('A renter');
        // Surnames like "Dela Cruz" or "San Jose" start at the particle.
        $surname = count($parts) > 2 && in_array(mb_strtolower($parts[count($parts) - 2]), ['de', 'del', 'dela', 'delos', 'san', 'sta', 'sta.', 'santa', 'van', 'von'], true)
            ? $parts[count($parts) - 2]
            : (count($parts) > 1 ? end($parts) : '');
        $last = $surname !== '' ? mb_strtoupper(mb_substr((string) $surname, 0, 1)).'.' : '';

        return trim("{$first} {$last}");
    }
}
