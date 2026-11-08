<?php

namespace App\Http\Controllers\Lessor;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class BookingLicenseController extends Controller
{
    /**
     * The renter's license photo, only for the car's owner.
     */
    public function show(Booking $booking): StreamedResponse
    {
        Gate::authorize('update', $booking);
        abort_unless($booking->license_photo_path && Storage::disk('local')->exists($booking->license_photo_path), 404);

        return Storage::disk('local')->response($booking->license_photo_path);
    }

    /**
     * Mark the renter's license as checked, or undo it.
     */
    public function update(Request $request, Booking $booking): RedirectResponse
    {
        Gate::authorize('update', $booking);

        $isChecked = $request->validate(['checked' => ['required', 'boolean']])['checked'];
        $booking->forceFill(['license_checked_at' => $isChecked ? now() : null])->save();

        if ($isChecked) {
            $booking->recordEvent('license_checked');
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => $isChecked ? __('License marked as checked.') : __('License check undone.')]);

        return back();
    }
}
