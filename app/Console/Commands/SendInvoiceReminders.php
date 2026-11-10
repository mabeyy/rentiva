<?php

namespace App\Console\Commands;

use App\Enums\UserStatus;
use App\Models\Invoice;
use App\Models\Setting;
use App\Notifications\InvoiceReminder;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Builder;

#[Signature('billing:send-reminders')]
#[Description('Remind owners once when an invoice is about to be due, and once after it goes overdue.')]
class SendInvoiceReminders extends Command
{
    /**
     * Execute the console command. Each reminder is sent once per invoice;
     * a day the scheduler missed is caught up on the next run.
     */
    public function handle(): int
    {
        $graceDays = (int) Setting::get(Setting::BillingGraceDays);
        $sent = 0;

        $payable = fn (): Builder => Invoice::query()
            ->whereIn('status', ['unpaid', 'rejected'])
            ->whereRelation('owner', 'status', UserStatus::Active)
            ->with('owner');

        // Due today or tomorrow, and not reminded yet.
        $payable()
            ->whereNull('due_reminder_sent_at')
            ->whereDate('due_on', '>=', today())
            ->whereDate('due_on', '<=', today()->addDay())
            ->each(function (Invoice $invoice) use ($graceDays, &$sent): void {
                $invoice->owner->notify(new InvoiceReminder($invoice, InvoiceReminder::DueTomorrow, $graceDays));
                $invoice->forceFill(['due_reminder_sent_at' => now()])->save();
                $sent++;
            });

        // Past due in the last week, and not told yet.
        $payable()
            ->whereNull('overdue_reminder_sent_at')
            ->whereDate('due_on', '<', today())
            ->whereDate('due_on', '>=', today()->subDays(7))
            ->each(function (Invoice $invoice) use ($graceDays, &$sent): void {
                $invoice->owner->notify(new InvoiceReminder($invoice, InvoiceReminder::Overdue, $graceDays));
                $invoice->forceFill(['overdue_reminder_sent_at' => now()])->save();
                $sent++;
            });

        $this->info("Sent {$sent} ".str('reminder')->plural($sent).'.');

        return self::SUCCESS;
    }
}
