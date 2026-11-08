<?php

namespace App\Http\Controllers\Lessor;

use App\Http\Controllers\Controller;
use App\Http\Resources\BookingEventResource;
use App\Models\BookingEvent;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ActivityController extends Controller
{
    /**
     * A feed of who did what to the lessor's bookings and cars, newest first.
     */
    public function __invoke(Request $request): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:80'],
            'action' => ['nullable', Rule::in(BookingEvent::ACTIONS)],
            'actor' => ['nullable', Rule::in(['renter', 'owner', 'staff'])],
        ]);
        $search = $filters['search'] ?? null;

        $events = BookingEventResource::collection(BookingEvent::query()
            ->forOwner($request->user()->id)
            ->with('booking:id,reference,renter_name,car_id', 'booking.car:id,make,model,year,pickup_location_id', 'car:id,make,model,year,pickup_location_id')
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
            ->paginate(20)
            ->withQueryString());

        return Inertia::render('lessor/activity', [
            'events' => $events,
            'filters' => (object) $filters,
        ]);
    }
}
