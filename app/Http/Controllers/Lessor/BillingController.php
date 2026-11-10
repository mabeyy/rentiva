<?php

namespace App\Http\Controllers\Lessor;

use App\Actions\Billing\InvoiceUpgrade;
use App\Actions\Billing\IssueNextInvoice;
use App\Actions\Images\StoreOptimizedImage;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Plan;
use App\Models\Setting;
use App\Models\Subscription;
use App\Models\User;
use App\Notifications\InvoicePaymentSubmitted;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Illuminate\View\View;
use Inertia\Inertia;
use Inertia\Response;

class BillingController extends Controller
{
    /**
     * The owner's plan, invoices, and where to pay Rentiva.
     */
    public function index(Request $request): Response
    {
        $owner = $request->user();
        $subscription = Subscription::for($owner)->load('plan', 'pendingPlan');
        $hasPendingChange = $subscription->pending_plan_id !== null || $subscription->pending_billing_cycle !== null;

        return Inertia::render('lessor/billing', [
            'subscription' => [
                'plan_id' => $subscription->plan_id,
                'billing_cycle' => $subscription->billing_cycle,
                'next_invoice_on' => $subscription->plan_id && ! $subscription->cancelled_at ? $subscription->nextPeriodStart()->toDateString() : null,
                'period_end' => $subscription->current_period_end?->toDateString(),
                // Set once the owner cancels: the last day of their paid-for plan.
                'ends_on' => $subscription->cancelled_at ? $subscription->current_period_end?->toDateString() : null,
                // A smaller plan or cycle switch waiting for the next period.
                'pending' => $hasPendingChange ? [
                    'plan_name' => $subscription->pendingPlan->name ?? $subscription->plan?->name,
                    'billing_cycle' => $subscription->pending_billing_cycle ?? $subscription->billing_cycle,
                    'starts_on' => $subscription->nextPeriodStart()->toDateString(),
                ] : null,
            ],
            'plans' => Plan::query()->where('is_active', true)->orderBy('sort')->orderBy('price')->get()
                ->map(fn (Plan $plan): array => $plan->toCard()),
            'usage' => [
                'cars' => $owner->cars()->count(),
                'staff' => $owner->team()->count(),
            ],
            'invoices' => $owner->invoices()->latest('period_start')->limit(24)->get()->map(fn (Invoice $invoice): array => [
                ...$invoice->only(['id', 'number', 'plan_name', 'amount', 'status', 'payment_reference', 'rejection_reason', 'cancel_reason']),
                'period_start' => $invoice->period_start->toDateString(),
                'period_end' => $invoice->period_end->toDateString(),
                'due_on' => $invoice->due_on->toDateString(),
                'is_overdue' => $invoice->isOverdue(),
                'paid_at' => $invoice->paid_at?->toIso8601String(),
            ]),
            'bankAccounts' => collect(Setting::platformBankAccounts())->map(fn (array $account): array => collect($account)->except('qr_path')->all())->all(),
        ]);
    }

    /**
     * Pick or switch plans. A first plan is invoiced right away. A bigger
     * plan starts now, with an invoice for the rest of the period; a smaller
     * plan or a monthly/yearly switch starts with the next period.
     */
    public function update(Request $request, IssueNextInvoice $issueNextInvoice, InvoiceUpgrade $upgradeInvoice): RedirectResponse
    {
        $owner = $request->user();
        $data = $request->validate([
            'plan_id' => ['required', 'integer', Rule::exists('plans', 'id')->where('is_active', true)],
            'billing_cycle' => ['sometimes', Rule::in(['monthly', 'yearly'])],
        ]);
        $plan = Plan::query()->where('is_active', true)->whereKey($data['plan_id'])->firstOrFail();
        $subscription = Subscription::for($owner)->load('plan');
        $cycle = $data['billing_cycle'] ?? $subscription->billing_cycle;
        $isSamePlan = $plan->id === $subscription->plan_id && $cycle === $subscription->billing_cycle;

        // Keeping the plan you're on never needs the limit check.
        $tooBig = $isSamePlan ? null : match (true) {
            $plan->max_cars !== null && $owner->cars()->count() > $plan->max_cars => __('You have more cars than :plan allows (:count). Remove some first, or pick a bigger plan.', ['plan' => $plan->name, 'count' => $plan->max_cars]),
            $plan->max_staff !== null && $owner->team()->count() > $plan->max_staff => $plan->max_staff === 0
                ? __(':plan doesn\'t include staff accounts. Remove your staff under Team first, or pick a bigger plan.', ['plan' => $plan->name])
                : __('You have more staff than :plan allows (:count). Remove some under Team first, or pick a bigger plan.', ['plan' => $plan->name, 'count' => $plan->max_staff]),
            ! $plan->includes('multiple_locations') && $owner->pickupLocations()->count() > 1 => __(':plan includes one pickup location. Remove the others first, or pick a bigger plan.', ['plan' => $plan->name]),
            default => null,
        };

        if ($tooBig) {
            throw ValidationException::withMessages(['plan_id' => $tooBig]);
        }

        // On a plan means a paid-for period that hasn't ended, cancelled or not:
        // picking a plan then also undoes a cancellation, and goes through the
        // same upgrade/downgrade rules instead of starting over for free.
        $isOnPlan = $subscription->plan !== null && $subscription->current_period_end?->gte(today());

        if ($isOnPlan && $subscription->cancelled_at) {
            $subscription->update(['cancelled_at' => null]);
        }

        if (! $isOnPlan) {
            // A first plan (or one picked after the last ran out) starts today:
            // no back-billing for a gap, e.g. after a suspension.
            $subscription->update([
                'plan_id' => $plan->id,
                'billing_cycle' => $cycle,
                'cancelled_at' => null,
                'pending_plan_id' => null,
                'pending_billing_cycle' => null,
                ...($subscription->current_period_end ? ['current_period_end' => today()->subDay(), 'anchor_day' => null] : []),
            ]);
            $issueNextInvoice->handle($subscription->fresh());
            Inertia::flash('toast', ['type' => 'success', 'message' => __('You\'re on the :plan plan.', ['plan' => $plan->name])]);
        } elseif ($isSamePlan) {
            $subscription->update(['pending_plan_id' => null, 'pending_billing_cycle' => null]);
            Inertia::flash('toast', ['type' => 'success', 'message' => __('You\'ll stay on the :plan plan.', ['plan' => $plan->name])]);
        } elseif ($cycle === $subscription->billing_cycle && $subscription->priceOf($plan) > $subscription->priceOf($subscription->plan)) {
            $upgradeInvoice->handle($subscription, $plan);
            Inertia::flash('toast', ['type' => 'success', 'message' => __('You\'re on the :plan plan now. We sent an invoice for the rest of this period.', ['plan' => $plan->name])]);
        } else {
            // Downgrades and monthly/yearly switches wait for the next period, which is already paid for.
            $subscription->update(['pending_plan_id' => $plan->id, 'pending_billing_cycle' => $cycle]);
            Inertia::flash('toast', ['type' => 'success', 'message' => __('You\'ll move to :plan on :date.', ['plan' => $plan->name, 'date' => $subscription->nextPeriodStart()->format('M j, Y')])]);
        }

        return back();
    }

    /**
     * Stop the plan at the end of the period already invoiced. Nothing more is
     * invoiced; unpaid invoices are still owed.
     */
    public function cancel(Request $request): RedirectResponse
    {
        $subscription = Subscription::for($request->user());
        abort_unless($subscription->plan_id !== null && $subscription->cancelled_at === null, 422);

        // A smaller plan waiting for the next period won't start now.
        $subscription->update(['cancelled_at' => now(), 'pending_plan_id' => null, 'pending_billing_cycle' => null]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Plan cancelled. It stays on until :date.', ['date' => $subscription->current_period_end?->format('M j, Y')])]);

        return back();
    }

    /**
     * Keep a cancelled plan going before it ends.
     */
    public function resume(Request $request): RedirectResponse
    {
        $subscription = Subscription::for($request->user());
        abort_unless($subscription->plan_id !== null && $subscription->cancelled_at !== null, 422);

        $subscription->update(['cancelled_at' => null]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Your plan will carry on.')]);

        return back();
    }

    /**
     * A printable invoice, which doubles as the receipt once it's paid.
     */
    public function invoice(Request $request, Invoice $invoice): View
    {
        abort_unless($invoice->owner()->is($request->user()), 403);

        $owner = $request->user()->load('storefront');

        return view('documents.invoice', [
            'invoice' => $invoice,
            'owner' => $owner,
            'business' => $owner->storefront->name ?? $owner->name,
            'seller' => Setting::get(Setting::LegalName) ?: config('app.name'),
            'supportEmail' => Setting::get(Setting::SupportEmail) ?: config('mail.from.address'),
        ]);
    }

    /**
     * Tell Rentiva an invoice was paid, with the transfer reference and screenshot.
     */
    public function pay(Request $request, Invoice $invoice, StoreOptimizedImage $storeOptimizedImage): RedirectResponse
    {
        abort_unless($invoice->owner()->is($request->user()) && $invoice->isPayable(), 403);

        // Without an account to send to, there's no real transfer to check.
        if (Setting::platformBankAccounts() === []) {
            throw ValidationException::withMessages([
                'payment_reference' => __('Rentiva\'s payment details aren\'t set up yet, so there\'s nowhere to send it. Please contact support.'),
            ]);
        }

        $data = $request->validate([
            'payment_reference' => ['required', 'string', 'max:60'],
            'proof' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        if ($invoice->proof_path) {
            Storage::disk('local')->delete($invoice->proof_path);
        }

        $invoice->forceFill([
            'status' => 'submitted',
            'payment_reference' => $data['payment_reference'],
            'proof_path' => $storeOptimizedImage->handle($request->file('proof'), 'invoice-proofs', 'local', StoreOptimizedImage::DOCUMENT, 85),
            'submitted_at' => now(),
            'rejection_reason' => null,
        ])->save();

        Notification::send(User::query()->where('role', UserRole::Admin)->get(), new InvoicePaymentSubmitted($invoice));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Thanks! We\'ll confirm your payment soon.')]);

        return back();
    }
}
