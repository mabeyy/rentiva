<?php

namespace App\Http\Controllers\Public;

use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Models\Car;
use App\Models\Storefront;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Response;

class SitemapController extends Controller
{
    /**
     * Every public page search engines should find: the home page, the
     * directory, the legal pages, and each open booking page with its cars.
     */
    public function sitemap(): Response
    {
        $storefronts = Storefront::query()
            ->whereHas('owner', fn (Builder $owner) => $owner->where('status', UserStatus::Active))
            ->whereHas('cars', fn (Builder $cars) => $cars->listed())
            ->with(['cars' => fn ($cars) => $cars->listed()->select(['id', 'owner_id', 'slug', 'updated_at'])])
            ->get(['id', 'owner_id', 'slug', 'updated_at']);

        $urls = [
            ['loc' => route('home'), 'lastmod' => null],
            ['loc' => route('rent'), 'lastmod' => null],
            ['loc' => route('terms'), 'lastmod' => null],
            ['loc' => route('privacy'), 'lastmod' => null],
        ];

        foreach ($storefronts as $storefront) {
            $urls[] = ['loc' => route('storefronts.show', $storefront), 'lastmod' => $storefront->updated_at];

            foreach ($storefront->cars as $car) {
                /** @var Car $car */
                $urls[] = ['loc' => route('storefronts.cars.show', [$storefront, $car]), 'lastmod' => $car->updated_at];
            }
        }

        return response()
            ->view('sitemap', ['urls' => $urls])
            ->header('Content-Type', 'application/xml');
    }

    /**
     * Keep crawlers out of dashboards and renters' private booking links,
     * and point them to the sitemap.
     */
    public function robots(): Response
    {
        $rules = collect(['/admin', '/lessor', '/settings', '/bookings/', '/login', '/register', '/forgot-password'])
            ->map(fn (string $path): string => "Disallow: {$path}")
            ->implode("\n");

        return response("User-agent: *\n{$rules}\n\nSitemap: ".route('sitemap')."\n")
            ->header('Content-Type', 'text/plain');
    }
}
