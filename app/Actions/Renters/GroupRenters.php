<?php

namespace App\Actions\Renters;

use App\Models\Booking;
use App\Models\RenterFlag;
use App\Models\User;
use Illuminate\Support\Collection;

/**
 * Works out who an owner's renters are: bookings that share a mobile number
 * or an email belong to the same person, even if they changed one of them.
 */
class GroupRenters
{
    /**
     * Each renter, most recent first, with their bookings (newest first), every
     * number and email they used, and the owner's flag if any number is flagged.
     *
     * @return Collection<int, array{key: string, phone_keys: array<int, string>, emails: array<int, string>, bookings: Collection<int, Booking>, flag: string|null}>
     */
    public function handle(User $owner): Collection
    {
        $bookings = $owner->bookings()
            ->whereNotNull('renter_phone_key')
            ->where('renter_phone_key', '!=', '')
            ->whereNull('anonymized_at')
            ->latest('start_date')
            ->latest('bookings.id')
            ->get();

        $parent = [];
        $find = function (string $node) use (&$parent, &$find): string {
            $parent[$node] ??= $node;

            return $parent[$node] === $node ? $node : $parent[$node] = $find($parent[$node]);
        };
        $union = function (string $a, string $b) use (&$parent, $find): void {
            $parent[$find($a)] = $find($b);
        };

        foreach ($bookings as $booking) {
            $find("phone:{$booking->renter_phone_key}");

            if ($booking->renter_email) {
                $union('email:'.strtolower($booking->renter_email), "phone:{$booking->renter_phone_key}");
            }
        }

        $flags = RenterFlag::where('owner_id', $owner->id)->pluck('note', 'phone_key');

        return $bookings
            ->groupBy(fn (Booking $booking): string => $find("phone:{$booking->renter_phone_key}"))
            ->map(function (Collection $group) use ($flags): array {
                $phoneKeys = $group->pluck('renter_phone_key')->unique()->values()->all();

                return [
                    // The number from their latest booking identifies them.
                    'key' => $group->first()->renter_phone_key,
                    'phone_keys' => $phoneKeys,
                    'emails' => $group->pluck('renter_email')->filter()->map(fn (string $email): string => strtolower($email))->unique()->values()->all(),
                    'bookings' => $group->values(),
                    'flag' => collect($phoneKeys)->map(fn (string $key): ?string => $flags[$key] ?? null)->filter()->first(),
                ];
            })
            ->values();
    }

    /**
     * The renter a mobile number belongs to, if they've booked with the owner.
     *
     * @return array{key: string, phone_keys: array<int, string>, emails: array<int, string>, bookings: Collection<int, Booking>, flag: string|null}|null
     */
    public function find(User $owner, string $phoneKey): ?array
    {
        return $this->handle($owner)->first(fn (array $renter): bool => in_array($phoneKey, $renter['phone_keys'], true));
    }
}
