<?php

namespace App\Http\Controllers\Lessor;

use App\Concerns\ProvidesBlockOptions;
use App\Http\Controllers\Controller;
use App\Http\Requests\Lessor\SaveCarBlockRequest;
use App\Http\Resources\CarBlockResource;
use App\Models\Car;
use App\Models\CarBlock;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class CarBlockController extends Controller
{
    use ProvidesBlockOptions;

    /**
     * Every upcoming block across the owner's cars, optionally for one car.
     */
    public function index(Request $request): Response
    {
        $carSlug = $request->validate(['car' => ['nullable', 'string', 'max:120']])['car'] ?? null;

        return Inertia::render('lessor/bookings/blocked', [
            'blocks' => CarBlockResource::collection(
                CarBlock::query()
                    ->whereHas('car', fn ($car) => $car->where('owner_id', $request->user()->id)
                        ->when($carSlug, fn ($car, string $slug) => $car->where('slug', $slug)))
                    ->upcoming()
                    ->with('car.coverImage')
                    ->oldest('start_date')
                    ->get(),
            ),
            'carFilter' => $carSlug,
            'blockOptions' => $this->blockOptions($request->user()),
        ]);
    }

    /**
     * Take some of a car's days off the calendar.
     */
    public function store(SaveCarBlockRequest $request, Car $car): RedirectResponse
    {
        $block = $car->blocks()->create($request->validated());
        $car->recordEvent('blocked', $block->summary());

        return $this->saved(__('Dates blocked for :car.', ['car' => $car->name]));
    }

    /**
     * Change a block's days, reason or note.
     */
    public function update(SaveCarBlockRequest $request, Car $car, CarBlock $block): RedirectResponse
    {
        $before = $block->period();
        $block->update($request->validated());
        $car->recordEvent('block_changed', $block->period() === $before
            ? $block->summary()
            : __(':summary (was :before)', ['summary' => $block->summary(), 'before' => $before]));

        return $this->saved(__('Blocked dates updated.'));
    }

    /**
     * Open a car's blocked days to bookings again.
     */
    public function destroy(Car $car, CarBlock $block): RedirectResponse
    {
        Gate::authorize('update', $car);

        $block->delete();
        $car->recordEvent('unblocked', $block->summary());

        return $this->saved(__('Dates open for booking again.'));
    }

    private function saved(string $message): RedirectResponse
    {
        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return back();
    }
}
