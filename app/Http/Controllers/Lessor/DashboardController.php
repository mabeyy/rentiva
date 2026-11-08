<?php

namespace App\Http\Controllers\Lessor;

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
     * Show the lessor's listings, requests and earnings at a glance.
     */
    public function __invoke(Request $request): Response
    {
        $lessor = $request->user();

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
            'pendingBookings' => BookingResource::collection(
                $lessor->bookings()->inStatus(BookingStatus::Pending)->with('car')->oldest('start_date')->limit(5)->get(),
            ),
            'upcomingBookings' => BookingResource::collection(
                $lessor->bookings()->inStatus(BookingStatus::Confirmed)->whereDate('start_date', '>=', today())->with('car')->oldest('start_date')->limit(5)->get(),
            ),
            'storefront' => $lessor->storefront ? StorefrontResource::make($lessor->storefront) : null,
            'isSuspended' => $lessor->isSuspended(),
            // Worked out once here, so the server render and the browser agree.
            'greeting' => match (true) {
                now(Booking::PICKUP_TIMEZONE)->hour < 12 => __('Good morning'),
                now(Booking::PICKUP_TIMEZONE)->hour < 18 => __('Good afternoon'),
                default => __('Good evening'),
            },
            'checklist' => TeamMember::acting() ? null : $this->checklist($lessor),
        ]);
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
