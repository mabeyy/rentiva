<?php

namespace App\Actions\Billing;

use App\Models\Invoice;
use App\Models\Plan;
use App\Models\Subscription;
use App\Notifications\InvoiceIssued;
use Illuminate\Support\Facades\DB;

/**
 * Moves an owner to a bigger plan straight away and invoices the difference
 * for the days left in the period they already paid for, so a bigger plan
 * is never used for free.
 */
class InvoiceUpgrade
{
    public function handle(Subscription $subscription, Plan $plan): ?Invoice
    {
        $subscription->loadMissing('plan', 'owner');
        $periodEnd = $subscription->current_period_end;
        $periodStart = $subscription->currentPeriodStart();

        $invoice = DB::transaction(function () use ($subscription, $plan, $periodEnd, $periodStart): ?Invoice {
            $oldPrice = $subscription->priceOf($subscription->plan);
            $subscription->update(['plan_id' => $plan->id, 'pending_plan_id' => null, 'pending_billing_cycle' => null]);

            $start = today()->toImmutable();
            $daysLeft = max(0, (int) $start->diffInDays($periodEnd, false) + 1);
            $periodDays = max(1, (int) $periodStart->diffInDays($periodEnd) + 1);
            $amount = (int) round(($subscription->priceOf($plan) - $oldPrice) * min($daysLeft, $periodDays) / $periodDays);

            if ($amount <= 0) {
                return null;
            }

            return $subscription->owner->invoices()->create([
                'plan_id' => $plan->id,
                'plan_name' => __(':plan (upgrade, rest of period)', ['plan' => $plan->name]),
                'period_start' => $start,
                'period_end' => $periodEnd,
                'amount' => $amount,
                'status' => 'unpaid',
                'due_on' => today()->addDays(Invoice::DAYS_TO_PAY),
            ]);
        });

        if ($invoice) {
            $subscription->owner->notify(new InvoiceIssued($invoice));
        }

        return $invoice;
    }
}
