<?php

namespace App\Http\Controllers\Lessor;

use App\Actions\Renters\GroupRenters;
use App\Enums\BookingStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\BookingResource;
use App\Models\Booking;
use App\Models\RenterFlag;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Pagination\LengthAwarePaginator;
use Inertia\Inertia;
use Inertia\Response;

class RenterController extends Controller
{
    /**
     * Everyone who has booked with the owner. Bookings sharing a mobile
     * number or an email count as the same renter.
     */
    public function index(Request $request, GroupRenters $groupRenters): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:80'],
            'flagged' => ['nullable', 'boolean'],
        ]);
        $search = mb_strtolower($filters['search'] ?? '');
        $renters = $groupRenters->handle($request->user());

        $matching = $renters;

        if ($search !== '') {
            $matching = $matching->filter(fn (array $renter): bool => $renter['bookings']->contains(
                fn (Booking $booking): bool => str_contains(mb_strtolower($booking->renter_name), $search)
                    || str_contains($booking->renter_phone_key, preg_replace('/\D/', '', $search) ?: '#')
                    || str_contains(mb_strtolower((string) $booking->renter_email), $search),
            ));
        }

        if ($filters['flagged'] ?? false) {
            $matching = $matching->filter(fn (array $renter): bool => $renter['flag'] !== null);
        }

        $matching = $matching->values();

        $page = LengthAwarePaginator::resolveCurrentPage();
        $paginator = (new LengthAwarePaginator(
            $matching->forPage($page, 20)->map(fn (array $renter): array => $this->summary($renter))->values(),
            $matching->count(),
            20,
            $page,
            ['path' => $request->url(), 'query' => $request->query()],
        ));

        return Inertia::render('lessor/renters/index', [
            'renters' => JsonResource::collection($paginator),
            'filters' => (object) $filters,
            'flaggedCount' => $renters->whereNotNull('flag')->count(),
        ]);
    }

    /**
     * One renter's bookings with the owner, every number and email they used,
     * and the owner's private flag.
     */
    public function show(Request $request, string $phoneKey, GroupRenters $groupRenters): Response
    {
        $renter = $groupRenters->find($request->user(), $phoneKey);
        abort_if($renter === null, 404);

        $bookings = $renter['bookings']->load('car.coverImage');
        $latest = $bookings->first();

        return Inertia::render('lessor/renters/show', [
            'renter' => [
                'key' => $renter['key'],
                'name' => $latest->renter_name,
                'phone' => $latest->renter_phone,
                'email' => $bookings->pluck('renter_email')->filter()->first(),
                'other_phones' => $bookings->pluck('renter_phone')->unique()->reject(fn (string $phone): bool => $phone === $latest->renter_phone)->values(),
                'other_emails' => collect($renter['emails'])->reject(fn (string $email): bool => $email === strtolower((string) $bookings->pluck('renter_email')->filter()->first()))->values(),
                'license_number' => $bookings->pluck('renter_license_number')->filter()->first(),
                'total_spent' => (int) $bookings->whereIn('status', [BookingStatus::Confirmed, BookingStatus::Completed])->sum('total'),
                'flag' => $renter['flag'],
            ],
            'bookings' => BookingResource::collection($bookings),
        ]);
    }

    /**
     * Flag a renter with a private note, or clear the flag. The flag covers
     * every number they've used.
     */
    public function flag(Request $request, string $phoneKey, GroupRenters $groupRenters): RedirectResponse
    {
        $renter = $groupRenters->find($request->user(), $phoneKey);
        abort_if($renter === null, 404);

        $note = $request->validate(['note' => ['nullable', 'string', 'max:200']])['note'] ?? null;
        RenterFlag::where('owner_id', $request->user()->id)->whereIn('phone_key', $renter['phone_keys'])->delete();

        if ($note) {
            RenterFlag::create(['owner_id' => $request->user()->id, 'phone_key' => $renter['key'], 'note' => $note]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => $note ? __('Renter flagged.') : __('Flag removed.')]);

        return back();
    }

    /**
     * A renter's row in the list.
     *
     * @param  array{key: string, phone_keys: array<int, string>, emails: array<int, string>, bookings: EloquentCollection<int, Booking>, flag: string|null}  $renter
     * @return array<string, mixed>
     */
    private function summary(array $renter): array
    {
        $bookings = $renter['bookings'];
        $latest = $bookings->first();

        return [
            'key' => $renter['key'],
            'name' => $latest->renter_name,
            'phone' => $latest->renter_phone,
            'email' => $bookings->pluck('renter_email')->filter()->first(),
            'contacts_count' => count($renter['phone_keys']) + max(0, count($renter['emails']) - 1),
            'bookings_count' => $bookings->count(),
            'cancelled_count' => $bookings->where('status', BookingStatus::Cancelled)->count(),
            'total_spent' => (int) $bookings->whereIn('status', [BookingStatus::Confirmed, BookingStatus::Completed])->sum('total'),
            'last_start_date' => $latest->start_date->toDateString(),
            'flag' => $renter['flag'],
        ];
    }
}
