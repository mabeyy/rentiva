<?php

namespace App\Actions\Billing;

use App\Models\Invoice;
use App\Models\Subscription;
use App\Notifications\InvoiceIssued;
use Illuminate\Support\Facades\DB;

/**
 * Invoices an owner for their next month (or year) once it starts: the day
 * they pick a plan, then each period after.
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

        $invoice = DB::transaction(function () use ($subscription, $start): Invoice {
            $end = ($subscription->isYearly() ? $start->addYearNoOverflow() : $start->addMonthNoOverflow())->subDay();
            $subscription->update(['current_period_end' => $end]);

            return $subscription->owner->invoices()->create([
                'plan_id' => $subscription->plan_id,
                'plan_name' => $subscription->plan->name.($subscription->isYearly() ? ' (yearly)' : ''),
                'period_start' => $start,
                'period_end' => $end,
                'amount' => $subscription->isYearly() ? $subscription->plan->yearlyPrice() : $subscription->plan->price,
                'status' => 'unpaid',
                'due_on' => today()->addDays(Invoice::DAYS_TO_PAY),
            ]);
        });

        $subscription->owner->notify(new InvoiceIssued($invoice));

        return $invoice;
    }
}
