<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Requests\Public\StoreReviewRequest;
use App\Models\Booking;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

class ReviewController extends Controller
{
    /**
     * Save the guest renter's rating for their completed trip.
     */
    public function store(StoreReviewRequest $request, Booking $booking): RedirectResponse
    {
        $booking->review()->make($request->validated())
            ->car()->associate($booking->car_id)
            ->save();
        $booking->recordEvent('reviewed', __(':rating out of 5 stars', ['rating' => $request->validated('rating')]));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Thanks for your review!')]);

        return redirect()->to($booking->manageUrl());
    }
}
