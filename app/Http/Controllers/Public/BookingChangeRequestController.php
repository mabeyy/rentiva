<?php

namespace App\Http\Controllers\Public;

use App\Enums\BookingStatus;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BookingChangeRequestController extends Controller
{
    /**
     * A renter asks the owner to move their dates. Nothing changes until the
     * owner approves.
     */
    public function store(Request $request, Booking $booking): RedirectResponse
    {
        abort_unless(in_array($booking->status, [BookingStatus::Pending, BookingStatus::Confirmed], true) && $booking->change_request === null, 403);

        $data = $request->validate([
            'start_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'end_date' => ['required', 'date_format:Y-m-d', 'after:start_date', 'before_or_equal:start_date +30 days'],
            'note' => ['nullable', 'string', 'max:300'],
        ]);

        $booking->forceFill(['change_request' => [...$data, 'note' => $data['note'] ?? null, 'requested_at' => now()->toIso8601String()]])->save();
        $booking->recordEvent('change_requested', $data['note'] ?? null);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Request sent. The owner will reply by email.')]);

        return back();
    }
}
