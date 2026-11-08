<?php

namespace App\Http\Controllers\Lessor;

use App\Actions\Cars\DeleteCar;
use App\Actions\Cars\SaveCar;
use App\Concerns\ProvidesCarOptions;
use App\Http\Controllers\Controller;
use App\Http\Requests\Lessor\StoreCarRequest;
use App\Http\Requests\Lessor\UpdateCarRequest;
use App\Http\Resources\CarResource;
use App\Http\Resources\FeatureResource;
use App\Http\Resources\PickupLocationResource;
use App\Models\Car;
use App\Models\Feature;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class CarController extends Controller
{
    use ProvidesCarOptions;

    /**
     * List the lessor's cars.
     */
    public function index(Request $request): Response
    {
        return Inertia::render('lessor/cars/index', [
            'cars' => CarResource::collection(
                $request->user()->cars()->with('coverImage')->withCount('bookings')->latest()->get(),
            ),
        ]);
    }

    /**
     * Show the form for listing a new car.
     */
    public function create(Request $request): Response
    {
        Gate::authorize('create', Car::class);

        return Inertia::render('lessor/cars/create', $this->formOptions($request));
    }

    /**
     * Save a new car as a draft.
     */
    public function store(StoreCarRequest $request, SaveCar $saveCar): RedirectResponse
    {

        $car = $saveCar->handle(
            $request->user()->cars()->make(),
            $request->safe()->except(['features', 'images']),
            $request->validated('features', []),
            $request->file('images', []),
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Car saved as a draft. Submit it for review when you are ready.')]);

        return to_route('lessor.cars.edit', $car);
    }

    /**
     * Show the form for editing a car.
     */
    public function edit(Request $request, Car $car): Response
    {
        Gate::authorize('update', $car);

        return Inertia::render('lessor/cars/edit', [
            'car' => CarResource::make($car->load(['images', 'features', 'owner.storefront'])),
            'upcomingBlocksCount' => $car->blocks()->upcoming()->count(),
            'services' => $car->services()->limit(20)->get()->map(fn ($service): array => [
                'id' => $service->id,
                'serviced_on' => $service->serviced_on->toDateString(),
                'odometer' => $service->odometer,
                'description' => $service->description,
                'cost' => $service->cost,
            ]),
            ...$this->formOptions($request),
        ]);
    }

    /**
     * Update a car's details and photos.
     */
    public function update(UpdateCarRequest $request, Car $car, SaveCar $saveCar): RedirectResponse
    {
        $saveCar->handle(
            $car,
            $request->safe()->except(['features', 'images', 'removed_image_ids']),
            $request->validated('features', []),
            $request->file('images', []),
            $request->validated('removed_image_ids', []),
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Car updated.')]);

        return to_route('lessor.cars.edit', $car);
    }

    /**
     * Delete a car that has no upcoming bookings.
     */
    public function destroy(Car $car, DeleteCar $deleteCar): RedirectResponse
    {
        Gate::authorize('delete', $car);

        $deleteCar->handle($car);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Car deleted.')]);

        return to_route('lessor.cars.index');
    }

    /**
     * Get the select options the car form needs.
     *
     * @return array<string, mixed>
     */
    private function formOptions(Request $request): array
    {
        return [
            ...$this->carOptions(),
            'features' => FeatureResource::collection(Feature::orderBy('name')->get()),
            'pickupLocations' => PickupLocationResource::collection($request->user()->pickupLocations()->orderBy('city')->orderBy('address')->get()),
            'mainPickupLocationId' => $request->user()->storefront?->main_pickup_location_id,
        ];
    }
}
