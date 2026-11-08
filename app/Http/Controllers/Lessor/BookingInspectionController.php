<?php

namespace App\Http\Controllers\Lessor;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\BookingInspection;
use App\Models\TeamMember;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class BookingInspectionController extends Controller
{
    /**
     * Record the car's condition at pickup or return. Saving again replaces
     * the earlier check of the same kind.
     */
    public function store(Request $request, Booking $booking): RedirectResponse
    {
        Gate::authorize('update', $booking);
        abort_unless($request->user()->planIncludes('inspections'), 403);

        $data = $request->validate([
            'type' => ['required', Rule::in(BookingInspection::TYPES)],
            'fuel_level' => ['required', 'integer', 'between:0,8'],
            'odometer' => ['required', 'integer', 'between:0,2000000'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'photos' => ['array', 'max:'.BookingInspection::MAX_PHOTOS],
            'photos.*' => ['image', 'mimes:jpg,jpeg,png,webp', 'max:8192'],
        ]);

        $existing = $booking->inspections()->where('type', $data['type'])->first();

        if ($existing) {
            Storage::disk('local')->delete($existing->photos ?? []);
        }

        $booking->inspections()->updateOrCreate(['type' => $data['type']], [
            'fuel_level' => $data['fuel_level'],
            'odometer' => $data['odometer'],
            'notes' => $data['notes'] ?? null,
            'photos' => collect($request->file('photos', []))->map(fn ($photo) => $photo->store("inspections/{$booking->id}", 'local'))->all(),
            'recorded_by' => TeamMember::acting()?->name ?? $request->user()->name,
        ]);

        $booking->recordEvent($data['type'] === 'pickup' ? 'pickup_checked' : 'return_checked', __(':km km · fuel :fuel/8', [
            'km' => number_format($data['odometer']),
            'fuel' => $data['fuel_level'],
        ]));

        Inertia::flash('toast', ['type' => 'success', 'message' => $data['type'] === 'pickup' ? __('Pickup check saved.') : __('Return check saved.')]);

        return back();
    }

    /**
     * One photo from a check, only for the car's owner.
     */
    public function photo(Booking $booking, BookingInspection $inspection, int $index): StreamedResponse
    {
        Gate::authorize('update', $booking);

        $path = $inspection->photos[$index] ?? null;
        abort_unless($inspection->booking_id === $booking->id && $path && Storage::disk('local')->exists($path), 404);

        return Storage::disk('local')->response($path);
    }
}
