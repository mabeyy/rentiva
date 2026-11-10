<?php

namespace App\Console\Commands;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\BookingInspection;
use App\Models\NotificationLog;
use App\Models\RenterFlag;
use App\Models\Setting;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

#[Signature('bookings:anonymize')]
#[Description("Strip renters' personal details from bookings older than each owner's data retention period.")]
class AnonymizeOldBookings extends Command
{
    /** Written over a renter's personal fields; the booking itself is kept. */
    public const string REDACTED = 'Removed';

    public const string REDACTED_EMAIL = 'removed@removed.invalid';

    /**
     * Execute the console command. The car, dates and amounts stay behind for
     * the owner's records; only who rented is removed. Active bookings are
     * never touched.
     */
    public function handle(): int
    {
        $anonymized = 0;

        Booking::query()
            ->whereNull('anonymized_at')
            ->whereIn('status', [BookingStatus::Completed, BookingStatus::Cancelled, BookingStatus::Declined])
            ->with('car.owner.storefront')
            // By id: rows change as they're cleaned, which would shift pages.
            ->lazyById()
            ->each(function (Booking $booking) use (&$anonymized): void {
                $months = $booking->car->owner->storefront?->dataRetentionMonths() ?? (int) Setting::get(Setting::DataRetentionMonths);

                if ($booking->end_date->addMonths($months)->isFuture()) {
                    return;
                }

                $booking->loadMissing('inspections');
                Storage::disk('local')->delete(array_filter([
                    $booking->payment_proof_path,
                    $booking->license_photo_path,
                    ...$booking->inspections->flatMap(fn (BookingInspection $inspection): array => $inspection->photos ?? []),
                ]));
                $booking->inspections()->update(['photos' => null, 'notes' => null]);

                $booking->forceFill([
                    'renter_name' => self::REDACTED,
                    'renter_email' => self::REDACTED_EMAIL,
                    'renter_phone' => self::REDACTED,
                    'renter_license_number' => self::REDACTED,
                    'notes' => null,
                    'payment_reference' => null,
                    'payment_proof_path' => null,
                    'license_photo_path' => null,
                    'delivery_address' => null,
                    // Free text that can name or describe the renter.
                    'change_request' => null,
                    'decline_reason' => null,
                    'cancel_reason' => null,
                    'payment_rejection_reason' => null,
                    'deposit_note' => null,
                    'refund_note' => null,
                    'refund_reference' => null,
                    'anonymized_at' => now(),
                ])->save();

                $booking->events()->where('actor_type', 'renter')->update(['actor_name' => self::REDACTED]);
                $booking->events()->update(['description' => null]);
                // The delivery log held their email, number and the texts sent to them.
                NotificationLog::query()->where('booking_id', $booking->id)->update(['recipient' => self::REDACTED, 'summary' => self::REDACTED]);
                $anonymized++;
            });

        // Flags on renters follow the same retention as their bookings.
        RenterFlag::query()->with('owner.storefront')->each(function (RenterFlag $flag): void {
            $months = $flag->owner?->storefront?->dataRetentionMonths() ?? (int) Setting::get(Setting::DataRetentionMonths);

            if ($flag->updated_at?->addMonths($months)->isPast()) {
                $flag->delete();
            }
        });

        $this->info("Anonymized {$anonymized} ".str('booking')->plural($anonymized).'.');

        return self::SUCCESS;
    }
}
