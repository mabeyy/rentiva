<?php

namespace App\Actions\Analytics;

use App\Enums\BookingSource;
use App\Models\Booking;
use App\Models\Car;
use App\Models\PageVisit;
use App\Models\Storefront;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;

/**
 * Turns counted page visits into the numbers owners and the admin act on:
 * who visited, where they came from, and how many went on to book or sign up.
 * Visitors count once a day (see PageVisit), so "visitors" over a month is
 * the sum of each day's visitors.
 */
class BuildTrafficReport
{
    /**
     * How many days back the reports cover.
     */
    public const int DAYS = 30;

    /**
     * An owner's booking page: visitors, car views, online requests, the top
     * sources and how each car is doing.
     *
     * @return array{visitors: int, car_views: int, requests: int, request_rate: float|null, sources: array<int, array{source: string|null, visitors: int}>, cars: array<int, array{name: string, views: int, requests: int}>}
     */
    public function forStorefront(Storefront $storefront): array
    {
        $since = $this->since();
        $visits = fn (): Builder => PageVisit::query()->where('storefront_id', $storefront->id)->where('created_at', '>=', $since);
        $onlineRequests = fn (): Builder => Booking::query()
            ->whereHas('car', fn (Builder $car) => $car->where('owner_id', $storefront->owner_id))
            ->where('source', BookingSource::Online)
            ->where('created_at', '>=', $since);

        $visitors = $visits()->distinct()->count('visitor');
        $requests = $onlineRequests()->count();
        $requestsByCar = $onlineRequests()->selectRaw('car_id, count(*) as aggregate')->groupBy('car_id')->pluck('aggregate', 'car_id');
        $viewsByCar = $visits()->where('page', 'car')->selectRaw('car_id, count(*) as aggregate')->groupBy('car_id')->pluck('aggregate', 'car_id');

        $cars = Car::query()
            ->whereKey($viewsByCar->keys()->merge($requestsByCar->keys())->unique()->all())
            ->get()
            ->map(fn (Car $car): array => [
                'name' => $car->name,
                'views' => (int) ($viewsByCar[$car->id] ?? 0),
                'requests' => (int) ($requestsByCar[$car->id] ?? 0),
            ])
            ->sortBy([['views', 'desc'], ['requests', 'desc']])
            ->take(5)
            ->values()
            ->all();

        return [
            'visitors' => $visitors,
            'car_views' => $visits()->where('page', 'car')->count(),
            'requests' => $requests,
            'request_rate' => $visitors > 0 ? round($requests / $visitors * 100, 1) : null,
            'sources' => $this->topSources($visits()),
            'cars' => $cars,
        ];
    }

    /**
     * Rentiva as a whole: the owner sign-up funnel and renter traffic.
     *
     * @return array{owners: array{home_visitors: int, signup_visitors: int, signups: int, added_car: int, got_request: int}, renters: array{directory_visitors: int, booking_page_visitors: int, requests: int}, sources: array<int, array{source: string|null, visitors: int}>}
     */
    public function forPlatform(): array
    {
        $since = $this->since();
        $visitors = fn (string ...$pages): int => PageVisit::query()
            ->whereIn('page', $pages)
            ->where('created_at', '>=', $since)
            ->distinct()
            ->count('visitor');
        $newOwners = fn (): Builder => User::query()->lessors()->where('created_at', '>=', $since);

        return [
            'owners' => [
                'home_visitors' => $visitors('home'),
                'signup_visitors' => $visitors('register'),
                'signups' => $newOwners()->count(),
                'added_car' => $newOwners()->whereHas('cars')->count(),
                'got_request' => $newOwners()->whereHas('bookings', fn (Builder $booking) => $booking->where('source', BookingSource::Online))->count(),
            ],
            'renters' => [
                'directory_visitors' => $visitors('directory'),
                'booking_page_visitors' => $visitors('storefront', 'car'),
                'requests' => Booking::query()->where('source', BookingSource::Online)->where('created_at', '>=', $since)->count(),
            ],
            'sources' => $this->topSources(PageVisit::query()->where('created_at', '>=', $since)),
        ];
    }

    /**
     * The four sites sending the most visitors; null stands for direct
     * visits and links opened from chat apps, which hide where they came from.
     *
     * @param  Builder<PageVisit>  $visits
     * @return array<int, array{source: string|null, visitors: int}>
     */
    private function topSources(Builder $visits): array
    {
        return $visits
            ->selectRaw('source, count(distinct visitor) as visitors')
            ->groupBy('source')
            ->orderByDesc('visitors')
            ->limit(4)
            ->get()
            ->map(fn (PageVisit $visit): array => ['source' => $visit->source, 'visitors' => (int) $visit->getAttribute('visitors')])
            ->all();
    }

    private function since(): CarbonInterface
    {
        return now()->subDays(self::DAYS);
    }
}
