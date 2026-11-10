<?php

namespace App\Http\Controllers\Admin;

use App\Enums\BookingStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateLessorStatusRequest;
use App\Http\Resources\BookingResource;
use App\Http\Resources\CarResource;
use App\Http\Resources\LessorResource;
use App\Models\AdminAction;
use App\Models\Invoice;
use App\Models\Plan;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LessorController extends Controller
{
    /**
     * List lessors with their listing and booking counts.
     */
    public function index(Request $request): Response
    {
        $search = $request->validate(['search' => ['nullable', 'string', 'max:100']])['search'] ?? null;

        return Inertia::render('admin/lessors/index', [
            'lessors' => LessorResource::collection(
                User::lessors()
                    ->when($search, fn ($query, string $search) => $query->where(
                        fn ($query) => $query->whereLike('name', "%{$search}%")
                            ->orWhereLike('email', "%{$search}%")
                            ->orWhereHas('storefront', fn ($query) => $query->whereLike('name', "%{$search}%")),
                    ))
                    ->with('storefront')
                    ->withCount(['cars', 'bookings'])
                    ->latest()
                    ->paginate(15)
                    ->withQueryString(),
            ),
            'search' => $search,
        ]);
    }

    /**
     * Show a lessor's cars, bookings and track record.
     */
    public function show(User $lessor): Response
    {
        abort_unless($lessor->hasRole(UserRole::Lessor), 404);

        $bookingCounts = $lessor->bookings()
            ->toBase()
            ->selectRaw('bookings.status, count(*) as aggregate')
            ->groupBy('bookings.status')
            ->pluck('aggregate', 'status');

        return Inertia::render('admin/lessors/show', [
            'lessor' => LessorResource::make($lessor->load('storefront')->loadCount(['cars', 'bookings'])),
            'cars' => CarResource::collection($lessor->cars()->with('coverImage')->withCount('bookings')->latest()->get()),
            'recentBookings' => BookingResource::collection($lessor->bookings()->with('car')->latest()->limit(10)->get()),
            'retention' => $lessor->storefront ? [
                'data_retention_months' => $lessor->storefront->data_retention_months,
                'proof_retention_days' => $lessor->storefront->proof_retention_days,
                'platform_data_retention_months' => (int) Setting::get(Setting::DataRetentionMonths),
                'platform_proof_retention_days' => (int) Setting::get(Setting::ProofRetentionDays),
            ] : null,
            'subscription' => $lessor->subscription ? [
                'plan_id' => $lessor->subscription->plan_id,
                'paused' => $lessor->isBillingPaused(),
                'priority_support' => $lessor->planIncludes('priority_support'),
                'billing_cycle' => $lessor->subscription->billing_cycle,
                'paid_through' => $lessor->subscription->current_period_end?->toDateString(),
                'ends_on' => $lessor->subscription->cancelled_at ? $lessor->subscription->current_period_end?->toDateString() : null,
                'pending_plan' => $lessor->subscription->pending_plan_id || $lessor->subscription->pending_billing_cycle
                    ? ($lessor->subscription->pendingPlan->name ?? $lessor->subscription->plan?->name).' ('.($lessor->subscription->pending_billing_cycle ?? $lessor->subscription->billing_cycle).')'
                    : null,
            ] : null,
            'plans' => Plan::query()->orderBy('sort')->orderBy('price')->get(['id', 'name', 'price']),
            'invoices' => $lessor->invoices()->latest('period_start')->limit(5)->get()->map(fn (Invoice $invoice): array => [
                ...$invoice->only(['id', 'number', 'plan_name', 'amount', 'status']),
                'period_start' => $invoice->period_start->toDateString(),
                'is_overdue' => $invoice->isOverdue(),
            ]),
            'stats' => [
                'earnings' => (int) $lessor->bookings()->inStatus(BookingStatus::Confirmed, BookingStatus::Completed)->sum('total'),
                'completed' => (int) ($bookingCounts[BookingStatus::Completed->value] ?? 0),
                'declined' => (int) ($bookingCounts[BookingStatus::Declined->value] ?? 0),
                'cancelled' => (int) ($bookingCounts[BookingStatus::Cancelled->value] ?? 0),
            ],
        ]);
    }

    /**
     * Suspend or reinstate a lessor. Suspension hides all of their cars.
     */
    public function update(UpdateLessorStatusRequest $request, User $lessor): RedirectResponse
    {
        abort_unless($lessor->hasRole(UserRole::Lessor), 404);

        $wasSuspended = $lessor->status === UserStatus::Suspended;
        $lessor->status = $request->enum('status', UserStatus::class);
        $lessor->save();

        // Coming back from a suspension: billing restarts today rather than
        // invoicing every period they couldn't use.
        $subscription = $lessor->subscription;

        if ($wasSuspended && $lessor->status === UserStatus::Active && $subscription?->current_period_end?->lt(today())) {
            $subscription->update(['current_period_end' => today()->subDay(), 'anchor_day' => null]);
        }
        AdminAction::record($lessor, $lessor->status === UserStatus::Suspended ? 'owner_suspended' : 'owner_reinstated');

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name is now :status.', [
            'name' => $lessor->name,
            'status' => strtolower($lessor->status->label()),
        ])]);

        return back();
    }
}
