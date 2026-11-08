<?php

namespace App\Http\Controllers\Lessor;

use App\Actions\Billing\IssueNextInvoice;
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
        $subscription = Subscription::for($owner)->load('plan');

        return Inertia::render('lessor/billing', [
            'subscription' => [
                'plan_id' => $subscription->plan_id,
                'billing_cycle' => $subscription->billing_cycle,
                'next_invoice_on' => $subscription->plan_id ? $subscription->nextPeriodStart()->toDateString() : null,
            ],
            'plans' => Plan::query()->where('is_active', true)->orderBy('sort')->orderBy('price')->get()
                ->map(fn (Plan $plan): array => $plan->toCard()),
            'usage' => [
                'cars' => $owner->cars()->count(),
                'staff' => $owner->team()->count(),
            ],
            'invoices' => $owner->invoices()->latest('period_start')->limit(24)->get()->map(fn (Invoice $invoice): array => [
                ...$invoice->only(['id', 'number', 'plan_name', 'amount', 'status', 'payment_reference', 'rejection_reason']),
                'period_start' => $invoice->period_start->toDateString(),
                'period_end' => $invoice->period_end->toDateString(),
                'due_on' => $invoice->due_on->toDateString(),
                'is_overdue' => $invoice->isOverdue(),
                'paid_at' => $invoice->paid_at?->toIso8601String(),
            ]),
            'bankAccounts' => Setting::get(Setting::PlatformBankAccounts) ?? [],
        ]);
    }

    /**
     * Pick or switch plans. Picking the first plan invoices the first month
     * right away; switching changes the price from the next invoice.
     */
    public function update(Request $request, IssueNextInvoice $issueNextInvoice): RedirectResponse
    {
        $owner = $request->user();
        $data = $request->validate([
            'plan_id' => ['required', 'integer', Rule::exists('plans', 'id')->where('is_active', true)],
            'billing_cycle' => ['sometimes', Rule::in(['monthly', 'yearly'])],
        ]);
        $plan = Plan::query()->where('is_active', true)->findOrFail($data['plan_id']);

        $tooBig = match (true) {
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

        $subscription = Subscription::for($owner);
        $subscription->update(['plan_id' => $plan->id, 'billing_cycle' => $data['billing_cycle'] ?? $subscription->billing_cycle]);
        $issueNextInvoice->handle($subscription->fresh());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('You\'re on the :plan plan.', ['plan' => $plan->name])]);

        return back();
    }

    /**
     * Tell Rentiva an invoice was paid, with the transfer reference and screenshot.
     */
    public function pay(Request $request, Invoice $invoice): RedirectResponse
    {
        abort_unless($invoice->owner()->is($request->user()) && $invoice->isPayable(), 403);

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
            'proof_path' => $request->file('proof')->store('invoice-proofs', 'local'),
            'submitted_at' => now(),
            'rejection_reason' => null,
        ])->save();

        Notification::send(User::query()->where('role', UserRole::Admin)->get(), new InvoicePaymentSubmitted($invoice));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Thanks! We\'ll confirm your payment soon.')]);

        return back();
    }
}
