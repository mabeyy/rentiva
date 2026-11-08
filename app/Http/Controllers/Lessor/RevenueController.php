<?php

namespace App\Http\Controllers\Lessor;

use App\Actions\Revenue\BuildRevenueReport;
use App\Enums\BookingStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\BookingResource;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class RevenueController extends Controller
{
    public function __construct(private readonly BuildRevenueReport $buildReport) {}

    /**
     * Show the owner's revenue by day, week or month over a date range.
     */
    public function index(Request $request): Response
    {
        [$from, $to] = $this->dateRange($request);

        return Inertia::render('lessor/revenue', [
            'report' => $this->buildReport->handle($request->user(), $this->granularity($request), $from, $to),
            // Only resolved by a partial reload when a day row is opened.
            'dayBookings' => Inertia::optional(fn (): ?array => $this->dayBookings($request)),
        ]);
    }

    /**
     * Download the report on screen as CSV, or one week/month of it by day.
     */
    public function export(Request $request): StreamedResponse
    {
        $granularity = $this->granularity($request);
        [$from, $to] = $this->dateRange($request);
        $report = $this->buildReport->handle($request->user(), $granularity, $from, $to);

        if (($key = $request->query('key')) !== null) {
            $row = collect($report['rows'])->firstWhere('key', $key);
            abort_unless(is_array($row), 404);

            return $this->stream("revenue-{$key}-daily.csv", 'Day', $row['children'] ?? [], ['label' => 'Total'] + $row);
        }

        return $this->stream(
            "revenue-{$granularity}-".today()->format('Y-m-d').'.csv',
            ucfirst($granularity),
            $report['rows'],
            ['label' => 'Total'] + $report['totals'],
        );
    }

    /**
     * The owner's confirmed and completed bookings picked up on the requested day.
     *
     * @return array{date: string, bookings: mixed}|null
     */
    private function dayBookings(Request $request): ?array
    {
        $day = $request->query('day');

        if (! is_string($day) || preg_match('/^\d{4}-\d{2}-\d{2}$/', $day) !== 1) {
            return null;
        }

        return [
            'date' => $day,
            'bookings' => BookingResource::collection(
                $request->user()->bookings()
                    ->inStatus(BookingStatus::Confirmed, BookingStatus::Completed)
                    ->whereDate('start_date', $day)
                    ->with('car')
                    ->get(),
            )->resolve(),
        ];
    }

    /**
     * Stream a CSV: header, one line per row, then a totals line. Amounts in pesos.
     *
     * @param  array<int, array<string, mixed>>  $rows
     * @param  array<string, mixed>  $totalRow
     */
    private function stream(string $filename, string $periodColumn, array $rows, array $totalRow): StreamedResponse
    {
        return response()->streamDownload(function () use ($periodColumn, $rows, $totalRow): void {
            $handle = fopen('php://output', 'w');

            if ($handle === false) {
                return;
            }

            fputcsv($handle, [$periodColumn, 'Bookings', 'Rental days', 'Revenue (PHP)']);

            foreach ([...$rows, $totalRow] as $row) {
                fputcsv($handle, [
                    $row['label'],
                    $row['bookings'],
                    $row['days'],
                    number_format($row['revenue'] / 100, 2, '.', ''),
                ]);
            }

            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv']);
    }

    /**
     * Daily by default; an invalid value falls back to monthly.
     */
    private function granularity(Request $request): string
    {
        $value = $request->query('granularity');

        if ($value === null) {
            return 'day';
        }

        return in_array($value, BuildRevenueReport::GRANULARITIES, true) ? $value : 'month';
    }

    /**
     * The ?from=&to= range (Y-m-d), defaulting to this month so far.
     *
     * @return array{0: string, 1: string}
     */
    private function dateRange(Request $request): array
    {
        $isDate = fn (mixed $value): bool => is_string($value) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $value) === 1;
        $from = $request->query('from');
        $to = $request->query('to');

        if ($isDate($from) && $isDate($to)) {
            return [$from, $to];
        }

        return [today()->startOfMonth()->toDateString(), today()->toDateString()];
    }
}
