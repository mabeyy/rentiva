<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminAction;
use App\Models\Review;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ReviewController extends Controller
{
    /**
     * Reviews owners reported, waiting for a decision, and the ones hidden.
     */
    public function index(Request $request): Response
    {
        $status = $request->string('status')->toString() === 'hidden' ? 'hidden' : 'reported';
        $reported = fn (): Builder => Review::query()->whereNotNull('reported_at')->whereNull('hidden_at');
        $hidden = fn (): Builder => Review::query()->whereNotNull('hidden_at');

        return Inertia::render('admin/reviews', [
            'reviews' => JsonResource::collection(($status === 'hidden' ? $hidden() : $reported())
                ->with('car.owner.storefront', 'booking:id,reference,renter_name')
                ->latest($status === 'hidden' ? 'hidden_at' : 'reported_at')
                ->paginate(20)
                ->withQueryString()
                ->through(fn (Review $review): array => [
                    'id' => $review->id,
                    'rating' => $review->rating,
                    'comment' => $review->comment,
                    'owner_reply' => $review->owner_reply,
                    'report_reason' => $review->report_reason,
                    'renter_name' => $review->booking->renter_name,
                    'reference' => $review->booking->reference,
                    'car_name' => $review->car->name,
                    'business' => $review->car->owner->storefront->name ?? $review->car->owner->name,
                    'created_at' => $review->created_at?->toIso8601String(),
                    'is_hidden' => $review->hidden_at !== null,
                ])),
            'status' => $status,
            'counts' => ['reported' => $reported()->count(), 'hidden' => $hidden()->count()],
        ]);
    }

    /**
     * Hide a review from public pages and averages, keep it (dismissing the
     * report), or show a hidden one again.
     */
    public function update(Request $request, Review $review): RedirectResponse
    {
        $outcomes = [
            'hide' => [['hidden_at' => now()], 'review_hidden', __('Review hidden from the booking page.')],
            'keep' => [['reported_at' => null, 'report_reason' => null], 'review_kept', __('Report dismissed. The review stays up.')],
            'show' => [['hidden_at' => null, 'reported_at' => null, 'report_reason' => null], 'review_shown', __('Review shown again.')],
        ];
        $request->validate(['decision' => ['required', Rule::in(array_keys($outcomes))]]);
        [$changes, $action, $message] = $outcomes[$request->string('decision')->toString()];

        $review->forceFill($changes)->save();
        AdminAction::record($review, $action);
        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return back();
    }
}
