<?php

namespace App\Actions\Revenue;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * An owner's revenue report: their confirmed and completed bookings grouped
 * into day, week or month buckets by pickup date, with totals. Amounts are in
 * centavos, matching the rest of the app.
 */
class BuildRevenueReport
{
    /** @var array<int, string> */
    public const array GRANULARITIES = ['day', 'week', 'month'];

    /** Largest range each granularity will render, in buckets. */
    private const array MAX_BUCKETS = ['day' => 92, 'week' => 53, 'month' => 24];

    /**
     * Build the report over an inclusive Y-m-d range.
     *
     * @return array{
     *     granularity: string,
     *     today: string,
     *     from: string,
     *     to: string,
     *     rows: array<int, array<string, mixed>>,
     *     totals: array<string, int>,
     * }
     */
    public function handle(User $owner, string $granularity, string $from, string $to): array
    {
        $granularity = in_array($granularity, self::GRANULARITIES, true) ? $granularity : 'month';
        $buckets = $this->buckets($granularity, $from, $to);
        $start = $buckets->first()['start'];
        $end = $buckets->last()['end'];

        /** @var Collection<int, Booking> $bookings */
        $bookings = $owner->bookings()
            ->inStatus(BookingStatus::Confirmed, BookingStatus::Completed)
            ->whereDate('start_date', '>=', $start->toDateString())
            ->whereDate('start_date', '<=', $end->toDateString())
            ->get(['bookings.id', 'start_date', 'end_date', 'total']);

        $withChildren = $granularity !== 'day';

        $rows = $buckets->map(function (array $bucket) use ($bookings, $withChildren): array {
            $inBucket = $bookings->filter(fn (Booking $booking): bool => $booking->start_date->between($bucket['start'], $bucket['end']));
            $row = $this->summarise($bucket['key'], $bucket['label'], $inBucket);

            if ($withChildren && $inBucket->isNotEmpty()) {
                $row['children'] = $this->dayChildren($inBucket);
            }

            return $row;
        })->values();

        return [
            'granularity' => $granularity,
            'today' => today()->toDateString(),
            'from' => $start->toDateString(),
            'to' => $end->toDateString(),
            'rows' => $rows->all(),
            'totals' => $this->totals($rows),
        ];
    }

    /**
     * @param  Collection<int, Booking>  $bookings
     * @return array<string, mixed>
     */
    private function summarise(string $key, string $label, Collection $bookings): array
    {
        $revenue = (int) $bookings->sum('total');
        $count = $bookings->count();

        return [
            'key' => $key,
            'label' => $label,
            'bookings' => $count,
            'days' => (int) $bookings->sum(fn (Booking $booking): int => $booking->days()),
            'revenue' => $revenue,
            'averagePerBooking' => $count > 0 ? intdiv($revenue, $count) : 0,
        ];
    }

    /**
     * The days within a week or month that had bookings, oldest first.
     *
     * @param  Collection<int, Booking>  $bookings
     * @return array<int, array<string, mixed>>
     */
    private function dayChildren(Collection $bookings): array
    {
        return $bookings
            ->groupBy(fn (Booking $booking): string => $booking->start_date->toDateString())
            ->sortKeys()
            ->map(function (Collection $dayBookings): array {
                $date = $dayBookings->first()->start_date;

                return $this->summarise($date->toDateString(), $date->format('M j (D)'), $dayBookings);
            })
            ->values()
            ->all();
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $rows
     * @return array<string, int>
     */
    private function totals(Collection $rows): array
    {
        $revenue = (int) $rows->sum('revenue');
        $bookings = (int) $rows->sum('bookings');
        $days = (int) $rows->sum('days');

        return [
            'revenue' => $revenue,
            'bookings' => $bookings,
            'days' => $days,
            'averagePerBooking' => $bookings > 0 ? intdiv($revenue, $bookings) : 0,
            'averagePerDay' => $days > 0 ? intdiv($revenue, $days) : 0,
        ];
    }

    /**
     * Buckets across the range, most recent last, capped to the most recent N.
     *
     * @return Collection<int, array{key: string, label: string, start: CarbonInterface, end: CarbonInterface}>
     */
    private function buckets(string $granularity, string $from, string $to): Collection
    {
        $start = Carbon::parse($from)->startOfDay();
        $end = Carbon::parse($to)->startOfDay();

        if ($end->lessThan($start)) {
            [$start, $end] = [$end, $start];
        }

        [$floor, $cursor, $step] = match ($granularity) {
            'week' => [$start->copy()->startOfWeek(), $end->copy()->startOfWeek(), fn (Carbon $date): Carbon => $date->subWeek()],
            'month' => [$start->copy()->startOfMonth(), $end->copy()->startOfMonth(), fn (Carbon $date): Carbon => $date->subMonth()],
            default => [$start->copy(), $end->copy(), fn (Carbon $date): Carbon => $date->subDay()],
        };

        $buckets = collect();

        while ($cursor->greaterThanOrEqualTo($floor) && $buckets->count() < self::MAX_BUCKETS[$granularity]) {
            $buckets->prepend($this->bucket($granularity, $cursor->copy()));
            $step($cursor);
        }

        return $buckets;
    }

    /**
     * @return array{key: string, label: string, start: CarbonInterface, end: CarbonInterface}
     */
    private function bucket(string $granularity, Carbon $date): array
    {
        return match ($granularity) {
            'week' => [
                'key' => $date->copy()->startOfWeek()->toDateString(),
                'label' => $date->copy()->startOfWeek()->format('M j').' – '.$date->copy()->endOfWeek()->format(
                    $date->copy()->startOfWeek()->isSameMonth($date->copy()->endOfWeek()) ? 'j' : 'M j',
                ),
                'start' => $date->copy()->startOfWeek(),
                'end' => $date->copy()->endOfWeek(),
            ],
            'month' => [
                'key' => $date->format('Y-m'),
                'label' => $date->format('F Y'),
                'start' => $date->copy()->startOfMonth(),
                'end' => $date->copy()->endOfMonth(),
            ],
            default => [
                'key' => $date->toDateString(),
                'label' => $date->format('M j, Y'),
                'start' => $date->copy()->startOfDay(),
                'end' => $date->copy()->endOfDay(),
            ],
        };
    }
}
