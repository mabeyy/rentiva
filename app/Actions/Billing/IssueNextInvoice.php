<?php

namespace App\Actions\Billing;

use App\Models\Invoice;
use App\Models\Subscription;
use App\Notifications\InvoiceIssued;
use Illuminate\Support\Facades\DB;

/**
 * Invoices an owner for their next month (or year) once it starts: the day
 * they pick a plan, then each period after. A cancelled plan isn't invoiced
 * again; it ends once its paid-for period is over.
 */
class IssueNextInvoice
{
    public function handle(Subscription $subscription): ?Invoice
    {
        $subscription->loadMissing('plan', 'owner');
        $start = $subscription->nextPeriodStart();

        if ($start->isFuture() || ! $subscription->plan) {
            return null;
        }

        if ($subscription->cancelled_at) {
            $subscription->reset();

            return null;
        }

        // A downgrade or cycle change the owner chose starts with this period,
        // unless they've outgrown the smaller plan since; then they stay put.
        if ($subscription->pending_plan_id || $subscription->pending_billing_cycle) {
            $pendingPlan = $subscription->pendingPlan;
            $owner = $subscription->owner;
            $outgrown = $pendingPlan && (
                ($pendingPlan->max_cars !== null && $owner->cars()->count() > $pendingPlan->max_cars)
                || ($pendingPlan->max_staff !== null && $owner->team()->count() > $pendingPlan->max_staff)
            );

            $subscription->update([
                'plan_id' => $outgrown ? $subscription->plan_id : ($subscription->pending_plan_id ?? $subscription->plan_id),
                'billing_cycle' => $subscription->pending_billing_cycle ?? $subscription->billing_cycle,
                'pending_plan_id' => null,
                'pending_billing_cycle' => null,
            ]);
            $subscription->load('plan');
        }

        $invoice = DB::transaction(function () use ($subscription, $start): Invoice {
            $subscription->anchor_day ??= $start->day;
            $end = $subscription->periodEnd($start);
            $subscription->update(['current_period_end' => $end, 'anchor_day' => $subscription->anchor_day]);

            return $subscription->owner->invoices()->create([
                'plan_id' => $subscription->plan_id,
                'plan_name' => $subscription->plan->name.($subscription->isYearly() ? ' (yearly)' : ''),
                'period_start' => $start,
                'period_end' => $end,
                'amount' => $subscription->priceOf($subscription->plan),
                'status' => 'unpaid',
                'due_on' => today()->addDays(Invoice::DAYS_TO_PAY),
            ]);
        });

        $subscription->owner->notify(new InvoiceIssued($invoice));

        return $invoice;
    }
}
