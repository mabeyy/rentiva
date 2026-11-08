<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\BookingEventResource;
use App\Models\BookingEvent;
use App\Models\Storefront;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ActivityController extends Controller
{
    /**
     * A platform-wide feed of who did what to every owner's bookings and cars.
     */
    public function __invoke(Request $request): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:80'],
            'action' => ['nullable', Rule::in(BookingEvent::ACTIONS)],
            'actor' => ['nullable', Rule::in(['renter', 'owner', 'staff', 'admin', 'system'])],
            'owner' => ['nullable', 'integer', 'exists:storefronts,id'],
        ]);
        $search = $filters['search'] ?? null;

        $events = BookingEvent::query()
            ->with('booking:id,reference,renter_name,car_id', 'booking.car:id,owner_id,make,model,year,pickup_location_id', 'booking.car.owner:id,name', 'booking.car.owner.storefront:id,owner_id,name')
            ->with('car:id,owner_id,make,model,year,pickup_location_id', 'car.owner:id,name', 'car.owner.storefront:id,owner_id,name')
            ->when($filters['owner'] ?? null, fn (Builder $query, int $storefrontId) => $query->forOwner(
                (int) Storefront::whereKey($storefrontId)->value('owner_id'),
            ))
            ->when($filters['action'] ?? null, fn (Builder $query, string $action) => $query->where('action', $action))
            ->when($filters['actor'] ?? null, fn (Builder $query, string $actor) => $query->where('actor_type', $actor))
            ->when($search, fn (Builder $query, string $search) => $query->where(fn (Builder $inner) => $inner
                ->whereLike('actor_name', "%{$search}%")
                ->orWhereLike('description', "%{$search}%")
                ->orWhereHas('booking', fn (Builder $booking) => $booking
                    ->whereLike('reference', "%{$search}%")
                    ->orWhereLike('renter_name', "%{$search}%"))
                ->orWhereHas('car', fn (Builder $car) => $car
                    ->whereLike('make', "%{$search}%")
                    ->orWhereLike('model', "%{$search}%"))))
            ->latest('id')
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('admin/activity', [
            'events' => BookingEventResource::collection($events),
            'filters' => (object) $filters,
            'owners' => Storefront::orderBy('name')->get(['id', 'name'])
                ->map(fn (Storefront $storefront): array => ['value' => (string) $storefront->id, 'label' => $storefront->name]),
        ]);
    }
}
