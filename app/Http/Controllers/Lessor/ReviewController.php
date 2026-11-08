<?php

namespace App\Http\Controllers\Lessor;

use App\Http\Controllers\Controller;
use App\Models\Car;
use App\Models\Review;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Inertia\Inertia;
use Inertia\Response;

class ReviewController extends Controller
{
    /**
     * Every review of the owner's cars, with the rating breakdown.
     */
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'rating' => ['nullable', 'integer', 'between:1,5'],
            'unanswered' => ['nullable', 'boolean'],
            'car' => ['nullable', 'string', 'max:120'],
        ]);
        $ownReviews = fn (): Builder => Review::query()->whereRelation('car', 'owner_id', $request->user()->id);
        $counts = $ownReviews()->toBase()->selectRaw('rating, count(*) as aggregate')->groupBy('rating')->pluck('aggregate', 'rating');

        return Inertia::render('lessor/reviews', [
            'reviews' => JsonResource::collection($ownReviews()
                ->with('car:id,slug,make,model,year', 'booking:id,reference,renter_name,start_date,end_date')
                ->when($filters['rating'] ?? null, fn (Builder $query, int $rating) => $query->where('rating', $rating))
                ->when($filters['unanswered'] ?? false, fn (Builder $query) => $query->whereNull('owner_reply'))
                ->when($filters['car'] ?? null, fn (Builder $query, string $slug) => $query->whereRelation('car', 'slug', $slug))
                ->latest()
                ->paginate(15)
                ->withQueryString()
                ->through(fn (Review $review): array => [
                    'id' => $review->id,
                    'rating' => $review->rating,
                    'comment' => $review->comment,
                    'owner_reply' => $review->owner_reply,
                    'created_at' => $review->created_at?->toIso8601String(),
                    'car_name' => $review->car->name,
                    'renter_name' => $review->booking->renter_name,
                    'reference' => $review->booking->reference,
                ])),
            'summary' => [
                'count' => (int) $counts->sum(),
                'average' => $counts->sum() > 0 ? round($counts->map(fn ($count, $rating) => $count * $rating)->sum() / $counts->sum(), 1) : null,
                'breakdown' => collect(range(5, 1))->mapWithKeys(fn (int $rating): array => [$rating => (int) ($counts[$rating] ?? 0)]),
                'unanswered' => $ownReviews()->whereNull('owner_reply')->count(),
            ],
            // Each reviewed car's average, best first, to spot the weak ones.
            'cars' => $request->user()->cars()
                ->whereHas('reviews')
                ->withCount('reviews')
                ->withAvg('reviews', 'rating')
                ->get()
                ->sortByDesc('reviews_avg_rating')
                ->values()
                ->map(fn (Car $car): array => [
                    'slug' => $car->slug,
                    'name' => $car->name,
                    'count' => $car->reviews_count,
                    'average' => round((float) $car->reviews_avg_rating, 1),
                ]),
            'filters' => (object) $filters,
        ]);
    }

    /**
     * Answer a review, or clear the answer. The renter sees it on their booking.
     */
    public function reply(Request $request, Review $review): RedirectResponse
    {
        abort_unless($review->car->owner()->is($request->user()), 403);

        $reply = $request->validate(['owner_reply' => ['nullable', 'string', 'max:1000']])['owner_reply'] ?? null;
        $review->update(['owner_reply' => $reply, 'replied_at' => $reply ? now() : null]);

        if ($reply) {
            $review->booking->recordEvent('replied');
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => $reply ? __('Reply posted.') : __('Reply removed.')]);

        return back();
    }
}
