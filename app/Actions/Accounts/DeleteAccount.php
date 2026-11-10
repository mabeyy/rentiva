<?php

namespace App\Actions\Accounts;

use App\Enums\BookingStatus;
use App\Enums\UserRole;
use App\Models\Booking;
use App\Models\BookingInspection;
use App\Models\NotificationLog;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * Deletes an account for good. An owner can't while renters are counting on
 * an upcoming booking or an invoice is still owed. Their invoices are kept,
 * under the business name, for Rentiva's books; every uploaded file goes.
 */
class DeleteAccount
{
    /**
     * What has to be sorted out first, as messages for the owner. Empty
     * when the account can go.
     *
     * @return list<string>
     */
    public function blockers(User $user): array
    {
        if (! $user->hasRole(UserRole::Lessor)) {
            return [];
        }

        $blockers = [];
        $upcoming = $user->bookings()
            ->whereIn('bookings.status', [BookingStatus::Pending, BookingStatus::Confirmed])
            ->whereDate('bookings.end_date', '>=', today())
            ->count();

        if ($upcoming > 0) {
            $blockers[] = trans_choice('You have :count upcoming booking. Cancel it first, so the renter knows.|You have :count upcoming bookings. Cancel them first, so the renters know.', $upcoming);
        }

        if ($user->invoices()->whereIn('status', ['unpaid', 'rejected', 'submitted'])->exists()) {
            $blockers[] = __('You have an unpaid Rentiva invoice. Pay it under Billing first, or contact support.');
        }

        return $blockers;
    }

    public function handle(User $user): void
    {
        $files = $this->uploadedFiles($user);

        DB::transaction(function () use ($user): void {
            // Keep invoices for the books, under the business name only.
            $user->invoices()->update([
                'billed_to' => $user->storefront->name ?? $user->name,
                'proof_path' => null,
            ]);

            // Staff accounts only exist to work for this business.
            User::query()->whereIn('id', $user->team()->pluck('user_id'))->delete();

            // The delivery log holds renters' contact details.
            if ($user->storefront) {
                NotificationLog::query()->where('storefront_id', $user->storefront->id)->delete();
            }

            // Cars before the rest: they point at pickup locations, which may
            // not be removed while a car still uses them.
            $user->cars()->delete();
            $user->delete();
        });

        Storage::disk('public')->delete($files['public']);
        Storage::disk('local')->delete($files['local']);
    }

    /**
     * Every file uploaded for this account, on the public and private disks.
     *
     * @return array{public: list<string>, local: list<string>}
     */
    private function uploadedFiles(User $user): array
    {
        $bookings = $user->bookings()->with('inspections')->get();

        return [
            'public' => $this->paths(collect()
                ->merge($user->cars()->with('images')->get()->flatMap->images->pluck('path'))
                ->push($user->storefront?->logo_path)
                ->merge($user->storefront?->paymentAccounts()->pluck('qr_path') ?? [])),
            'local' => $this->paths(collect()
                ->merge($bookings->flatMap(fn (Booking $booking): array => [$booking->license_photo_path, $booking->payment_proof_path]))
                ->merge($bookings->flatMap->inspections->flatMap(fn (BookingInspection $inspection): array => $inspection->photos ?? []))
                ->merge($user->invoices()->pluck('proof_path'))
                ->merge($user->supportRequests()->pluck('screenshot_path'))),
        ];
    }

    /**
     * The stored file paths among the given values, skipping empty ones.
     *
     * @param  Collection<int, mixed>  $values
     * @return list<string>
     */
    private function paths(Collection $values): array
    {
        return array_values(array_filter($values->all(), fn (mixed $value): bool => is_string($value) && $value !== ''));
    }
}
