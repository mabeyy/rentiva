<?php

namespace App\Console\Commands;

use App\Enums\PaymentStatus;
use App\Models\Booking;
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

        Booking::query()
            ->whereNotNull('payment_proof_path')
            ->whereIn('payment_status', [PaymentStatus::Paid, PaymentStatus::Rejected])
            ->with('car.owner.storefront')
            ->each(function (Booking $booking) use (&$pruned): void {
                $retentionDays = $booking->car->owner->storefront?->proofRetentionDays() ?? (int) Setting::get(Setting::ProofRetentionDays);

                if ($booking->end_date->addDays($retentionDays)->isFuture()) {
                    return;
                }

                Storage::disk('local')->delete($booking->payment_proof_path);
                $booking->forceFill(['payment_proof_path' => null])->save();
                $pruned++;
            });

        $this->info("Deleted {$pruned} transfer ".str('screenshot')->plural($pruned).'.');

        return self::SUCCESS;
    }
}
