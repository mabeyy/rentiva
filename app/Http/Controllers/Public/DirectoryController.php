<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\StorefrontResource;
use App\Models\Storefront;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DirectoryController extends Controller
{
    /**
     * List rental businesses so renters pick a company, then book on its own page.
     */
    public function __invoke(Request $request): Response
    {
        $filters = $request->validate([
            'city' => ['nullable', 'string', 'max:80'],
            'search' => ['nullable', 'string', 'max:80'],
        ]);

        $isFiltered = filled($filters['city'] ?? null) || filled($filters['search'] ?? null);

        // Businesses on plans with a top spot, shown above the list (and left
        // out of it) when renters aren't searching.
        $featured = $isFiltered ? collect() : Storefront::inDirectory()
            ->whereHas('owner.subscription.plan', fn (Builder $plan) => $plan->whereJsonContains('features', 'featured_listing'))
            ->withCount('listedCars')
            ->withMin('listedCars', 'daily_rate')
            ->with(['listedCars' => fn ($cars) => $cars->select(['id', 'owner_id', 'body_type'])])
            ->inRandomOrder()
            ->limit(3)
            ->get()
            ->each(fn (Storefront $storefront) => $storefront->setAttribute('is_featured', true));

        return Inertia::render('rent/index', [
            'featured' => StorefrontResource::collection($featured),
            'storefronts' => StorefrontResource::collection(
                Storefront::inDirectory()
                    ->whereKeyNot($featured->pluck('id')->all())
                    ->when($filters['city'] ?? null, fn (Builder $query, string $city) => $query->where('city', $city))
                    ->when($filters['search'] ?? null, fn (Builder $query, string $search) => $query->whereLike('name', "%{$search}%"))
                    // Owners on plans with a featured listing come first.
                    ->withExists(['owner as is_featured' => fn (Builder $owner) => $owner->whereHas(
                        'subscription.plan',
                        fn (Builder $plan) => $plan->whereJsonContains('features', 'featured_listing'),
                    )])
                    ->withCount('listedCars')
                    ->withMin('listedCars', 'daily_rate')
                    ->with(['listedCars' => fn ($cars) => $cars->select(['id', 'owner_id', 'body_type'])])
                    ->orderByDesc('is_featured')
                    ->orderByDesc('listed_cars_count')
                    ->paginate(12)
                    ->withQueryString(),
            ),
            'cities' => Storefront::inDirectory()->whereNotNull('city')->distinct()->orderBy('city')->pluck('city'),
            'filters' => (object) $filters,
        ])->withViewData('meta', [
            'title' => 'Rent a car from trusted local rental companies - '.config('app.name'),
            'description' => 'Compare local car rental businesses in the Philippines and book directly with the operator. No account needed, pay at pickup.',
        ]);
    }
}
