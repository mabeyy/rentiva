<?php

namespace App\Console\Commands;

use App\Actions\Billing\IssueNextInvoice;
use App\Enums\UserStatus;
use App\Models\Subscription;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Throwable;

#[Signature('billing:issue-invoices')]
#[Description('Invoice each active owner with a plan for their next period once the last invoiced one ends. Suspended owners aren\'t invoiced.')]
class IssueInvoices extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(IssueNextInvoice $issueNextInvoice): int
    {
        $issued = 0;

        // By id, so owners whose plan ends during the run don't shift the
        // pages and get skipped; one owner's failure doesn't stop the rest.
        Subscription::query()
            ->whereNotNull('plan_id')
            ->whereRelation('owner', 'status', UserStatus::Active)
            ->with('plan', 'owner')
            ->lazyById()
            ->each(function (Subscription $subscription) use ($issueNextInvoice, &$issued): void {
                try {
                    if ($issueNextInvoice->handle($subscription)) {
                        $issued++;
                    }
                } catch (Throwable $exception) {
                    report($exception);
                }
            });

        $this->info("Issued {$issued} ".str('invoice')->plural($issued).'.');

        return self::SUCCESS;
    }
}
