<?php

namespace App\Http\Controllers\Lessor;

use App\Enums\CarStatus;
use App\Http\Controllers\Controller;
use App\Models\Car;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class CarActivationController extends Controller
{
    /**
     * Show an approved listing to renters again, or hide it. Bookings already
     * made are kept either way.
     */
    public function update(Request $request, Car $car): RedirectResponse
    {
        Gate::authorize('toggleActivation', $car);

        $isActive = $request->validate(['active' => ['required', 'boolean']])['active'];

        $car->update(['status' => $isActive ? CarStatus::Active : CarStatus::Inactive]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $isActive
                ? __(':car is visible to renters again.', ['car' => $car->name])
                : __(':car is hidden from renters.', ['car' => $car->name]),
        ]);

        return back();
    }
}
