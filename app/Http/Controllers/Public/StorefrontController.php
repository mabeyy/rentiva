<?php

namespace App\Http\Controllers\Public;

use App\Concerns\ProvidesCarOptions;
use App\Http\Controllers\Controller;
use App\Http\Requests\Public\SearchCarsRequest;
use App\Http\Resources\CarResource;
use App\Http\Resources\PublicReviewResource;
use App\Http\Resources\StorefrontResource;
use App\Models\Car;
use App\Models\Review;
use App\Models\Storefront;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class StorefrontController extends Controller
{
    use ProvidesCarOptions;

    /**
     * How many reviews a booking or car page shows before "See all".
     */
    private const int REVIEWS_SHOWN = 3;

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
            'reviews' => PublicReviewResource::collection($this->writtenReviews($storefront->reviews()->getQuery())->limit(self::REVIEWS_SHOWN)->get()),
            'writtenReviewCount' => $storefront->reviews()->whereNotNull('comment')->count(),
            'filters' => (object) $filters,
            ...$this->carOptions(),
        ])->withViewData('meta', $this->storefrontMeta($storefront, $fleet));
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
            'reviews' => PublicReviewResource::collection($this->writtenReviews($car->reviews()->getQuery())->limit(self::REVIEWS_SHOWN)->get()),
            'writtenReviewCount' => $car->reviews()->whereNotNull('comment')->count(),
            'reviewSummary' => [
                'count' => $car->reviews()->count(),
                'average' => round((float) $car->reviews()->avg('rating'), 1) ?: null,
            ],
        ])->withViewData('meta', $this->carMeta($storefront, $car));
    }

    /**
     * Every written review for the business, or one of its cars with
     * ?car=slug, with the average and how many gave each rating.
     */
    public function reviews(Request $request, Storefront $storefront): Response
    {
        abort_unless($storefront->isOpen(), 404);

        $carSlug = $request->validate(['car' => ['nullable', 'string', 'max:120']])['car'] ?? null;
        $car = $carSlug ? $storefront->listedCars()->where('slug', $carSlug)->first() : null;
        $reviews = fn (): Builder => $car ? $car->reviews()->getQuery() : $storefront->reviews()->getQuery();

        return Inertia::render('storefront/reviews', [
            'storefront' => StorefrontResource::make($storefront->load('pickupLocations')),
            'car' => $car ? ['slug' => $car->slug, 'name' => $car->name] : null,
            'summary' => $this->reviewSummary($reviews()),
            'reviews' => PublicReviewResource::collection($this->writtenReviews($reviews())->paginate(12)->withQueryString()),
        ])->withViewData('meta', [
            'title' => ($car ? "{$car->name} reviews" : 'Reviews').' | '.$storefront->name,
            'description' => 'What renters say about '.($car ? "the {$car->name} from " : '')."{$storefront->name}.",
            'url' => route('storefronts.reviews', $storefront),
        ]);
    }

    /**
     * Link-preview text for a booking page: where the business is, its
     * cheapest rate and how many cars it has.
     *
     * @param  Collection<int, Car>  $fleet
     * @return array{title: string, description: string, url: string, image?: string}
     */
    private function storefrontMeta(Storefront $storefront, Collection $fleet): array
    {
        $place = $storefront->city ? " in {$storefront->city}" : '';
        $priceFrom = $fleet->isNotEmpty() ? ' from '.self::peso($fleet->min('daily_rate')).'/day' : '';
        $image = $storefront->logo_url
            ?? $storefront->listedCars()->whereHas('images')->with('coverImage')->first()?->coverImage?->url;

        return $this->withImage([
            'title' => "{$storefront->name} | Car Rental{$place} | Book Online",
            'description' => $storefront->tagline
                ?: "Rent a car from {$storefront->name}{$place}{$priceFrom}. {$fleet->count()} ".str('vehicle')->plural($fleet->count()).' to choose from. Book online in minutes.',
            'url' => route('storefronts.show', $storefront),
        ], $image);
    }

    /**
     * Link-preview text for one car: its rate, seats and transmission, with
     * its first photo.
     *
     * @return array{title: string, description: string, url: string, image?: string}
     */
    private function carMeta(Storefront $storefront, Car $car): array
    {
        return $this->withImage([
            'title' => "{$car->name} for rent | {$storefront->name}",
            'description' => "Rent this {$car->name} from {$storefront->name} for ".self::peso($car->daily_rate)."/day. {$car->seats} seats, {$car->transmission->label()}. Book online and pay at pickup.",
            'url' => route('storefronts.cars.show', [$storefront, $car]),
        ], $car->images->first()?->url);
    }

    /**
     * Link-preview text with its image, when there is one.
     *
     * @param  array{title: string, description: string, url: string}  $meta
     * @return array{title: string, description: string, url: string, image?: string}
     */
    private function withImage(array $meta, ?string $image): array
    {
        return $image ? [...$meta, 'image' => $image] : $meta;
    }

    /**
     * "₱2,500" from centavos, without the centavos.
     */
    private static function peso(int $centavos): string
    {
        return '₱'.number_format($centavos / 100);
    }

    /**
     * Written reviews, newest first, with the car and renter loaded.
     *
     * @param  Builder<Review>  $reviews
     * @return Builder<Review>
     */
    private function writtenReviews(Builder $reviews): Builder
    {
        return $reviews
            ->whereNotNull('comment')
            ->with('car:id,make,model,year', 'booking:id,renter_name,anonymized_at')
            ->latest();
    }

    /**
     * How many reviews there are, their average, and how many gave each star
     * count from 5 down to 1.
     *
     * @param  Builder<Review>  $reviews
     * @return array{count: int, average: float|null, breakdown: array<int, int>}
     */
    private function reviewSummary(Builder $reviews): array
    {
        $byRating = (clone $reviews)->selectRaw('rating, count(*) as aggregate')->groupBy('rating')->pluck('aggregate', 'rating');
        $count = (int) $byRating->sum();

        return [
            'count' => $count,
            'average' => $count > 0 ? round($byRating->map(fn ($total, $rating): int => $rating * $total)->sum() / $count, 1) : null,
            'breakdown' => collect([5, 4, 3, 2, 1])->mapWithKeys(fn (int $rating): array => [$rating => (int) ($byRating[$rating] ?? 0)])->all(),
        ];
    }
}
