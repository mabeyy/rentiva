<?php

namespace App\Console\Commands;

use App\Actions\Billing\IssueNextInvoice;
use App\Models\Subscription;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('billing:issue-invoices')]
#[Description('Invoice each owner with a plan for their next month once the last invoiced month ends.')]
class IssueInvoices extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(IssueNextInvoice $issueNextInvoice): int
    {
        $issued = 0;

        Subscription::query()
            ->whereNotNull('plan_id')
            ->with('plan', 'owner')
            ->each(function (Subscription $subscription) use ($issueNextInvoice, &$issued): void {
                if ($issueNextInvoice->handle($subscription)) {
                    $issued++;
                }
            });

        $this->info("Issued {$issued} ".str('invoice')->plural($issued).'.');

        return self::SUCCESS;
    }
}
