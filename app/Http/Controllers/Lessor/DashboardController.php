<?php

namespace App\Http\Controllers\Lessor;

use App\Actions\Analytics\BuildTrafficReport;
use App\Enums\BookingStatus;
use App\Enums\CarStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\BookingResource;
use App\Http\Resources\StorefrontResource;
use App\Models\Booking;
use App\Models\TeamMember;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * How many days ahead the pickups-and-returns list looks.
     */
    private const int AGENDA_DAYS = 7;

    /**
     * The most pickups and returns listed at once.
     */
    private const int AGENDA_LIMIT = 8;

    /**
     * Show the lessor's listings, requests and earnings at a glance.
     */
    public function __invoke(Request $request): Response
    {
        $lessor = $request->user();
        // Renters' details only for people who handle bookings.
        $canSeeBookings = TeamMember::actingCan('bookings');

        return Inertia::render('lessor/dashboard', [
            'stats' => [
                'activeCars' => $lessor->cars()->where('status', CarStatus::Active)->count(),
                'pendingRequests' => $lessor->bookings()->inStatus(BookingStatus::Pending)->count(),
                'upcomingTrips' => $lessor->bookings()->inStatus(BookingStatus::Confirmed)->whereDate('start_date', '>=', today())->count(),
                // Money stays with the owner; staff don't see earnings.
                'monthEarnings' => TeamMember::acting() ? null : (int) $lessor->bookings()
                    ->inStatus(BookingStatus::Confirmed, BookingStatus::Completed)
                    ->whereBetween('start_date', [today()->startOfMonth(), today()->endOfMonth()])
                    ->sum('total'),
            ],
            'pendingBookings' => BookingResource::collection($canSeeBookings
                ? $lessor->bookings()->inStatus(BookingStatus::Pending)->with('car')->oldest('start_date')->limit(5)->get()
                : collect()),
            'agenda' => $canSeeBookings ? $this->agenda($lessor) : [],
            'toClose' => BookingResource::collection($canSeeBookings
                ? $lessor->bookings()->inStatus(BookingStatus::Confirmed)->whereDate('end_date', '<', today())->with('car')->oldest('end_date')->limit(5)->get()
                : collect()),
            'storefront' => $lessor->storefront ? StorefrontResource::make($lessor->storefront) : null,
            'isSuspended' => $lessor->isSuspended(),
            // Worked out once here, so the server render and the browser agree.
            'greeting' => match (true) {
                now(Booking::PICKUP_TIMEZONE)->hour < 12 => __('Good morning'),
                now(Booking::PICKUP_TIMEZONE)->hour < 18 => __('Good afternoon'),
                default => __('Good evening'),
            },
            'checklist' => TeamMember::acting() ? null : $this->checklist($lessor),
            'traffic' => $lessor->storefront ? app(BuildTrafficReport::class)->forStorefront($lessor->storefront) : null,
        ]);
    }

    /**
     * Pickups and returns over the next week, earliest first, so the owner
     * can see which cars leave and come back each day.
     *
     * @return array<int, array{type: string, date: string, booking: BookingResource}>
     */
    private function agenda(User $lessor): array
    {
        $until = today()->addDays(self::AGENDA_DAYS - 1);
        $bookings = $lessor->bookings()
            ->inStatus(BookingStatus::Confirmed)
            ->where(fn ($query) => $query
                ->whereBetween('start_date', [today(), $until])
                ->orWhereBetween('end_date', [today(), $until]))
            ->with('car')
            ->get();

        return $bookings
            ->flatMap(fn (Booking $booking): array => array_values(array_filter([
                $booking->start_date->between(today(), $until) ? ['type' => 'pickup', 'date' => $booking->start_date->toDateString(), 'booking' => $booking] : null,
                $booking->end_date->between(today(), $until) ? ['type' => 'return', 'date' => $booking->end_date->toDateString(), 'booking' => $booking] : null,
            ])))
            // Returns come before pickups on the same day: the car comes back, then goes out.
            ->sortBy([['date', 'asc'], ['type', 'desc']])
            ->take(self::AGENDA_LIMIT)
            ->map(fn (array $event): array => [...$event, 'booking' => BookingResource::make($event['booking'])])
            ->values()
            ->all();
    }

    /**
     * The first things a new owner should set up, and which are done. Null
     * once everything is.
     *
     * @return array<int, array{key: string, label: string, done: bool, href: string}>|null
     */
    private function checklist(User $lessor): ?array
    {
        $storefront = $lessor->storefront;
        $steps = [
            ['key' => 'storefront', 'label' => __('Set up your booking page'), 'done' => $storefront !== null, 'href' => route('lessor.storefront.edit')],
            ['key' => 'location', 'label' => __('Add a pickup location'), 'done' => $lessor->pickupLocations()->exists(), 'href' => route('lessor.pickup-locations.index')],
            ['key' => 'car', 'label' => __('Add your first car'), 'done' => $lessor->cars()->exists(), 'href' => route('lessor.cars.create')],
            ['key' => 'approved', 'label' => __('Get a car approved'), 'done' => $lessor->cars()->where('status', CarStatus::Active)->exists(), 'href' => route('lessor.cars.index')],
            ['key' => 'plan', 'label' => __('Pick a plan'), 'done' => $lessor->subscription?->plan_id !== null, 'href' => route('lessor.billing.index')],
        ];

        return collect($steps)->every('done') ? null : $steps;
    }
}
