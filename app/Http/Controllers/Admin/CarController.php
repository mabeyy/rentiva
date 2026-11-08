<?php

namespace App\Http\Controllers\Admin;

use App\Enums\CarStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateCarStatusRequest;
use App\Http\Resources\BookingResource;
use App\Http\Resources\CarBlockResource;
use App\Http\Resources\CarResource;
use App\Http\Resources\LessorResource;
use App\Models\Car;
use App\Notifications\CarStatusChanged;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CarController extends Controller
{
    /**
     * List every listing, filtered by status or search.
     */
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'status' => ['nullable', Rule::enum(CarStatus::class)],
            'search' => ['nullable', 'string', 'max:100'],
        ]);

        return Inertia::render('admin/cars/index', [
            'cars' => CarResource::collection(
                Car::query()
                    ->when($filters['status'] ?? null, fn ($query, string $status) => $query->where('status', $status))
                    ->filter(['search' => $filters['search'] ?? null])
                    ->with(['coverImage', 'owner.storefront'])
                    ->withCount('bookings')
                    ->paginate(15)
                    ->withQueryString(),
            ),
            'filters' => (object) $filters,
            'statuses' => CarStatus::options(),
        ]);
    }

    /**
     * Show a listing with its owner and booking history for review.
     */
    public function show(Car $car): Response
    {
        $car->load(['images', 'features', 'owner' => fn ($query) => $query->with('storefront')->withCount(['cars', 'bookings'])]);

        return Inertia::render('admin/cars/show', [
            'car' => CarResource::make($car),
            'owner' => LessorResource::make($car->owner),
            'bookings' => BookingResource::collection($car->bookings()->latest()->limit(10)->get()),
            'blocks' => CarBlockResource::collection($car->blocks()->upcoming()->oldest('start_date')->get()),
            'moderationStatuses' => array_map(fn (CarStatus $status) => $status->toOption(), CarStatus::moderationStatuses()),
        ]);
    }

    /**
     * Approve, reject or suspend a listing and notify its owner.
     */
    public function update(UpdateCarStatusRequest $request, Car $car): RedirectResponse
    {
        $status = $request->enum('status', CarStatus::class);

        $car->update([
            'status' => $status,
            'rejection_reason' => $status->requiresReason() ? $request->validated('reason') : null,
        ]);

        $car->owner->notify(new CarStatusChanged($car));

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':car is now :status.', [
            'car' => $car->name,
            'status' => strtolower($status->label()),
        ])]);

        return back();
    }
}
