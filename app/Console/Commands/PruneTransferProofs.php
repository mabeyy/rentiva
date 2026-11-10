<?php

namespace App\Console\Commands;

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Models\Booking;
use App\Models\Invoice;
use App\Models\Setting;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

#[Signature('payments:prune-proofs')]
#[Description("Delete checked transfer screenshots once each owner's retention period after the trip has passed.")]
class PruneTransferProofs extends Command
{
    /**
     * Execute the console command. Screenshots still waiting to be checked are
     * always kept.
     */
    public function handle(): int
    {
        $pruned = 0;

        // Checked screenshots, and any left on bookings that ended without a trip.
        Booking::query()
            ->whereNotNull('payment_proof_path')
            ->where(fn ($query) => $query
                ->whereIn('payment_status', [PaymentStatus::Paid, PaymentStatus::Rejected])
                ->orWhere(fn ($ended) => $ended
                    ->whereIn('status', [BookingStatus::Cancelled, BookingStatus::Declined])
                    // A transfer still waiting to be checked is kept until it is.
                    ->where('payment_status', '!=', PaymentStatus::Submitted)))
            ->with('car.owner.storefront')
            // By id: rows change as they're cleaned, which would shift pages.
            ->lazyById()
            ->each(function (Booking $booking) use (&$pruned): void {
                $retentionDays = $booking->car->owner->storefront?->proofRetentionDays() ?? (int) Setting::get(Setting::ProofRetentionDays);

                if ($booking->end_date->addDays($retentionDays)->isFuture()) {
                    return;
                }

                Storage::disk('local')->delete($booking->payment_proof_path);
                $booking->forceFill(['payment_proof_path' => null])->save();
                $pruned++;
            });

        // Owners' invoice payment screenshots, once the invoice is settled.
        $invoiceRetentionDays = (int) Setting::get(Setting::ProofRetentionDays);
        Invoice::query()
            ->whereNotNull('proof_path')
            ->whereIn('status', ['paid', 'cancelled'])
            ->where('updated_at', '<=', now()->subDays($invoiceRetentionDays))
            ->lazyById()
            ->each(function (Invoice $invoice) use (&$pruned): void {
                Storage::disk('local')->delete($invoice->proof_path);
                $invoice->forceFill(['proof_path' => null])->save();
                $pruned++;
            });

        $this->info("Deleted {$pruned} transfer ".str('screenshot')->plural($pruned).'.');

        return self::SUCCESS;
    }
}
