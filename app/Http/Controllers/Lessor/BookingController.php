<?php

namespace App\Http\Controllers\Lessor;

use App\Actions\Bookings\ChangeBookingStatus;
use App\Actions\Renters\GroupRenters;
use App\Concerns\ProvidesBlockOptions;
use App\Enums\BookingStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Lessor\UpdateBookingStatusRequest;
use App\Http\Resources\BookingEventResource;
use App\Http\Resources\BookingResource;
use App\Http\Resources\CarBlockResource;
use App\Models\Booking;
use App\Models\Car;
use App\Models\CarBlock;
use App\Models\PeakSeason;
use Carbon\CarbonInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class BookingController extends Controller
{
    use ProvidesBlockOptions;

    /**
     * List bookings on the lessor's cars, optionally by status.
     */
    public function index(Request $request): Response
    {
        $status = $request->validate([
            'status' => ['nullable', Rule::enum(BookingStatus::class)],
        ])['status'] ?? null;

        return Inertia::render('lessor/bookings/index', [
            'bookings' => BookingResource::collection(
                $request->user()->bookings()
                    ->when($status, fn ($query, string $status) => $query->inStatus($status))
                    ->with('car.coverImage')
                    ->latest('start_date')
                    ->paginate(15)
                    ->withQueryString(),
            ),
            'status' => $status,
            'statuses' => BookingStatus::options(),
        ]);
    }

    /**
     * Everything about one booking: renter, trip, price, payment, license,
     * history and review, with what the owner can do next.
     */
    public function show(Booking $booking): Response
    {
        Gate::authorize('update', $booking);

        $booking->load(['car.coverImage', 'car.pickupLocation', 'review', 'charges', 'inspections', 'events' => fn ($query) => $query->latest('id')]);

        return Inertia::render('lessor/bookings/show', [
            'booking' => BookingResource::make($booking),
            'events' => BookingEventResource::collection($booking->events->each->setRelation('booking', $booking)),
            'review' => $booking->review?->only(['id', 'rating', 'comment', 'owner_reply', 'created_at']),
            'cars' => $booking->car->owner->cars()->oldest('make')->get()->map(fn (Car $car): array => [
                'slug' => $car->slug,
                'name' => $car->name,
                ...$car->only(['daily_rate', 'security_deposit', 'weekly_discount', 'monthly_discount', 'delivery_fee', 'driver_daily_rate']),
                'booked_ranges' => $car->bookings()->reserving()->whereKeyNot($booking->id)->whereDate('end_date', '>', today())
                    ->get(['start_date', 'end_date'])
                    ->map(fn (Booking $other): array => ['start_date' => $other->start_date->toDateString(), 'end_date' => $other->end_date->toDateString()])
                    ->concat($car->blocks()->upcoming()->get()->map(fn (CarBlock $block): array => $block->asRentalRange()))
                    ->values(),
            ]),
            'chargeLabels' => BookingChargeController::SUGGESTED_LABELS,
            'businessName' => $booking->car->owner->storefront?->name ?? $booking->car->owner->name,
            'emailsRenter' => $booking->car->owner->planIncludes('email'),
            'seasons' => ! $booking->car->owner->planIncludes('peak_pricing') ? [] : $booking->car->owner->peakSeasons()->upcoming()->get()->map(fn (PeakSeason $season): array => PeakSeasonController::present($season)),
            'renter' => ($renter = $booking->renter_phone_key ? app(GroupRenters::class)->find($booking->car->owner, $booking->renter_phone_key) : null) ? [
                'key' => $renter['key'],
                'bookings_count' => $renter['bookings']->count(),
                'flag' => $renter['flag'],
            ] : null,
        ]);
    }

    /**
     * Show a month calendar of the lessor's rentals with one day's pickups,
     * returns and cars out on rent. Covers the whole visible grid, so days
     * spilling in from the neighbouring months show their bookings too.
     */
    public function calendar(Request $request): Response
    {
        $date = $request->validate([
            'date' => ['nullable', 'date_format:Y-m-d'],
        ])['date'] ?? null;

        $selected = $date ? Carbon::parse($date) : today();
        $gridStart = $selected->copy()->startOfMonth()->startOfWeek(CarbonInterface::SUNDAY);
        $gridEnd = $selected->copy()->endOfMonth()->endOfWeek(CarbonInterface::SATURDAY);

        return Inertia::render('lessor/bookings/calendar', [
            'bookings' => BookingResource::collection(
                $request->user()->bookings()
                    ->inStatus(BookingStatus::Pending, BookingStatus::Confirmed, BookingStatus::Completed)
                    ->whereDate('start_date', '<=', $gridEnd->toDateString())
                    ->whereDate('end_date', '>=', $gridStart->toDateString())
                    ->with('car.coverImage')
                    ->oldest('start_date')
                    ->get(),
            ),
            'blocks' => CarBlockResource::collection(
                CarBlock::query()
                    ->whereHas('car', fn ($car) => $car->where('owner_id', $request->user()->id))
                    ->whereDate('start_date', '<=', $gridEnd->toDateString())
                    ->whereDate('end_date', '>=', $gridStart->toDateString())
                    ->with('car.coverImage')
                    ->oldest('start_date')
                    ->get(),
            ),
            'blockOptions' => $this->blockOptions($request->user()),
            'selectedDate' => $selected->toDateString(),
            'today' => today()->toDateString(),
        ]);
    }

    /**
     * Confirm, decline, cancel or complete a booking.
     */
    public function update(UpdateBookingStatusRequest $request, Booking $booking, ChangeBookingStatus $changeBookingStatus): RedirectResponse
    {
        $status = $request->enum('status', BookingStatus::class);

        $changeBookingStatus->handle($booking, $status, $request->validated('reason'));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Booking :reference marked as :status.', [
            'reference' => $booking->reference,
            'status' => strtolower($status->label()),
        ])]);

        return back();
    }
}
