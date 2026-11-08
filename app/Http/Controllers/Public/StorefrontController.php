<?php

namespace App\Http\Controllers\Public;

use App\Concerns\ProvidesCarOptions;
use App\Http\Controllers\Controller;
use App\Http\Requests\Public\SearchCarsRequest;
use App\Http\Resources\CarResource;
use App\Http\Resources\StorefrontResource;
use App\Models\Booking;
use App\Models\Car;
use App\Models\Review;
use App\Models\Storefront;
use Illuminate\Database\Eloquent\Builder;
use Inertia\Inertia;
use Inertia\Response;

class StorefrontController extends Controller
{
    use ProvidesCarOptions;

    /**
     * Show a lessor's branded booking page with their bookable fleet.
     */
    public function show(SearchCarsRequest $request, Storefront $storefront): Response
    {
        abort_unless($storefront->isOpen(), 404);

        $filters = $request->validated();
        $fleet = $storefront->listedCars()->get(['id', 'body_type', 'daily_rate', 'pickup_location_id']);

        return Inertia::render('storefront/show', [
            'storefront' => StorefrontResource::make($storefront->load('pickupLocations')),
            'cars' => CarResource::collection(
                $storefront->listedCars()->filter($filters)->with('coverImage')->paginate(12)->withQueryString(),
            ),
            'summary' => [
                'vehicleCount' => $fleet->count(),
                'lowestDailyRate' => $fleet->min('daily_rate'),
                'bodyTypes' => $fleet->map(fn (Car $car): string => $car->body_type->label())->unique()->sort()->values(),
                'reviewCount' => $storefront->reviews()->count(),
                'averageRating' => round((float) $storefront->reviews()->avg('rating'), 1) ?: null,
            ],
            'locations' => $fleet->pluck('pickupLocation.city')->unique()->sort()->values(),
            'reviews' => $this->publicReviews($storefront->reviews()->getQuery()),
            'filters' => (object) $filters,
            ...$this->carOptions(),
        ]);
    }

    /**
     * Show one of the storefront's cars with its booking calendar.
     */
    public function car(Storefront $storefront, Car $car): Response
    {
        abort_unless($storefront->isOpen() && $car->owner_id === $storefront->owner_id && $car->isListed(), 404);

        return Inertia::render('storefront/car', [
            'storefront' => StorefrontResource::make($storefront->load('pickupLocations')),
            'car' => CarResource::make($car->load(['images', 'features'])),
            'bookedRanges' => $car->upcomingBookedRanges(),
            'reviews' => $this->publicReviews($car->reviews()->getQuery()),
            'reviewSummary' => [
                'count' => $car->reviews()->count(),
                'average' => round((float) $car->reviews()->avg('rating'), 1) ?: null,
            ],
        ]);
    }

    /**
     * The latest written reviews, with the renter shown as first name and
     * last initial, and the owner's reply.
     *
     * @param  Builder<Review>  $reviews
     * @return array<int, array<string, mixed>>
     */
    private function publicReviews(Builder $reviews): array
    {
        return $reviews
            ->whereNotNull('comment')
            ->with('car:id,make,model,year', 'booking:id,renter_name,anonymized_at')
            ->latest()
            ->limit(6)
            ->get()
            ->map(fn (Review $review): array => [
                'id' => $review->id,
                'rating' => $review->rating,
                'comment' => $review->comment,
                'owner_reply' => $review->owner_reply,
                'car_name' => $review->car->name,
                'renter' => self::publicName($review->booking),
                'created_at' => $review->created_at?->toIso8601String(),
            ])
            ->all();
    }

    /**
     * e.g. "Juan D." — never the full name in public.
     */
    private static function publicName(Booking $booking): string
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
