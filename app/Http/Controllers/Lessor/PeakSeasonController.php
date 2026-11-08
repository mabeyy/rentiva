<?php

namespace App\Http\Controllers\Lessor;

use App\Http\Controllers\Controller;
use App\Models\PeakSeason;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PeakSeasonController extends Controller
{
    /**
     * The owner's peak and low seasons, upcoming first.
     */
    public function index(Request $request): Response
    {
        return Inertia::render('lessor/seasons', [
            'seasons' => $request->user()->peakSeasons()->upcoming()->oldest('start_date')->get()
                ->map(fn (PeakSeason $season): array => self::present($season)),
            'pastCount' => $request->user()->peakSeasons()->whereDate('end_date', '<', today())->count(),
            'isIncluded' => $request->user()->planIncludes('peak_pricing'),
        ]);
    }

    /**
     * Add a season.
     */
    public function store(Request $request): RedirectResponse
    {
        abort_unless($request->user()->planIncludes('peak_pricing'), 403);

        $request->user()->peakSeasons()->create($this->validated($request));

        return $this->saved(__('Season added. Prices on your booking page follow it right away.'));
    }

    /**
     * Change a season.
     */
    public function update(Request $request, PeakSeason $season): RedirectResponse
    {
        abort_unless($season->owner()->is($request->user()) && $request->user()->planIncludes('peak_pricing'), 403);

        $season->update($this->validated($request, $season));

        return $this->saved(__('Season updated.'));
    }

    /**
     * Remove a season. Bookings already made keep their price.
     */
    public function destroy(Request $request, PeakSeason $season): RedirectResponse
    {
        abort_unless($season->owner()->is($request->user()), 403);

        $season->delete();

        return $this->saved(__('Season removed.'));
    }

    /**
     * @return array{id: int, name: string, start_date: string, end_date: string, rate_change: int}
     */
    public static function present(PeakSeason $season): array
    {
        return [
            'id' => $season->id,
            'name' => $season->name,
            'start_date' => $season->start_date->toDateString(),
            'end_date' => $season->end_date->toDateString(),
            'rate_change' => $season->rate_change,
        ];
    }

    /**
     * Seasons can't overlap, so each day has one rate.
     *
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?PeakSeason $season = null): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:60'],
            'start_date' => ['required', 'date_format:Y-m-d'],
            'end_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:start_date'],
            'rate_change' => ['required', 'integer', 'between:-50,200', 'not_in:0'],
        ], [
            'rate_change.not_in' => __('Raise or lower the rate by at least 1%.'),
            'rate_change.between' => __('Change the rate by -50% to +200%.'),
        ]);

        $overlaps = $request->user()->peakSeasons()
            ->when($season, fn ($query) => $query->whereKeyNot($season->id))
            ->whereDate('start_date', '<=', $data['end_date'])
            ->whereDate('end_date', '>=', $data['start_date'])
            ->exists();

        if ($overlaps) {
            throw ValidationException::withMessages(['start_date' => __('This overlaps another season.')]);
        }

        return $data;
    }

    private function saved(string $message): RedirectResponse
    {
        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return to_route('lessor.seasons.index');
    }
}
