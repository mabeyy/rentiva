<?php

namespace App\Http\Middleware;

use App\Models\Car;
use App\Models\PageVisit;
use App\Models\Storefront;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Counts views of the public pages in PageVisit::PAGES. Skips signed-in
 * users (owners checking their own page), bots and link-preview crawlers,
 * and reloads of the same page such as searching or changing a filter.
 */
class RecordPageVisit
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $page = PageVisit::PAGES[$request->route()?->getName() ?? ''] ?? null;

        if ($page !== null && $this->shouldCount($request, $response)) {
            $storefront = $request->route('storefront');
            $car = $request->route('car');

            PageVisit::create([
                'page' => $page,
                'storefront_id' => $storefront instanceof Storefront ? $storefront->id : null,
                'car_id' => $car instanceof Car ? $car->id : null,
                'visitor' => PageVisit::visitorFor($request),
                'source' => PageVisit::sourceFor($request),
            ]);
        }

        return $response;
    }

    /**
     * An Inertia visit from the same page, such as typing in a search box or
     * changing a filter, rather than arriving at it.
     */
    private function isReloadOfSamePage(Request $request): bool
    {
        return $request->headers->has('X-Inertia')
            && parse_url((string) $request->headers->get('referer'), PHP_URL_PATH) === '/'.ltrim($request->path(), '/');
    }

    private function shouldCount(Request $request, Response $response): bool
    {
        return $request->isMethod('GET')
            && $response->isSuccessful()
            && $request->user() === null
            && ! $request->headers->has('X-Inertia-Partial-Component')
            && ! $this->isReloadOfSamePage($request)
            && ! preg_match('/bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|headless|lighthouse/i', (string) $request->userAgent());
    }
}
