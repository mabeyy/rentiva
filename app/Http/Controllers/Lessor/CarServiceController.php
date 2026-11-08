<?php

namespace App\Http\Controllers\Lessor;

use App\Http\Controllers\Controller;
use App\Models\Car;
use App\Models\CarService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class CarServiceController extends Controller
{
    /**
     * Log a service, like an oil change or new tires.
     */
    public function store(Request $request, Car $car): RedirectResponse
    {
        Gate::authorize('update', $car);

        $data = $request->validate([
            'serviced_on' => ['required', 'date_format:Y-m-d', 'before_or_equal:today'],
            'odometer' => ['nullable', 'integer', 'between:0,2000000'],
            'description' => ['required', 'string', 'max:160'],
            'cost' => ['nullable', 'numeric', 'between:0,1000000'],
        ]);

        $car->services()->create([
            ...$data,
            'cost' => isset($data['cost']) ? (int) round($data['cost'] * 100) : null,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Service logged.')]);

        return back();
    }

    /**
     * Remove a log entry made by mistake.
     */
    public function destroy(Car $car, CarService $service): RedirectResponse
    {
        Gate::authorize('update', $car);
        abort_unless($service->car_id === $car->id, 404);

        $service->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Service removed.')]);

        return back();
    }
}
