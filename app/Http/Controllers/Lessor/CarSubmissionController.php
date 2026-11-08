<?php

namespace App\Http\Controllers\Lessor;

use App\Enums\CarStatus;
use App\Http\Controllers\Controller;
use App\Models\Car;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class CarSubmissionController extends Controller
{
    /**
     * Submit a draft or rejected car for admin review.
     */
    public function store(Car $car): RedirectResponse
    {
        Gate::authorize('submit', $car);

        $car->update(['status' => CarStatus::PendingReview, 'rejection_reason' => null]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Submitted for review. We will email you once an admin approves it.')]);

        return back();
    }
}
