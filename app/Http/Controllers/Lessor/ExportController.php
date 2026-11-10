<?php

namespace App\Http\Controllers\Lessor;

use App\Actions\Renters\GroupRenters;
use App\Enums\BookingStatus;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportController extends Controller
{
    /**
     * Every booking as a spreadsheet, optionally one status. Amounts in pesos.
     */
    public function bookings(Request $request): StreamedResponse
    {
        $status = $request->validate(['status' => ['nullable', Rule::enum(BookingStatus::class)]])['status'] ?? null;
        $bookings = $request->user()->bookings()
            ->when($status, fn ($query, string $status) => $query->inStatus($status))
            ->with('car')
            ->latest('start_date');

        return $this->csv('bookings', [
            'Reference', 'Status', 'Source', 'Car', 'Plate', 'Pickup', 'Return', 'Days', 'Renter', 'Mobile', 'Email',
            'Subtotal', 'Discount', 'Delivery', 'Driver', 'Extra charges', 'Total', 'Payment method', 'Payment status',
            'Down payment', 'Deposit', 'Refunded', 'Booked on',
        ], function ($handle) use ($bookings): void {
            $bookings->each(function (Booking $booking) use ($handle): void {
                fputcsv($handle, [
                    $booking->reference, $booking->status->label(), $booking->source->label(), $booking->car->name,
                    $booking->car->plate_number, $booking->start_date->toDateString(), $booking->end_date->toDateString(),
                    $booking->days(), $booking->renter_name, $booking->renter_phone, $booking->renter_email,
                    ...array_map(fn (int $centavos): string => number_format($centavos / 100, 2, '.', ''), [
                        $booking->subtotal, $booking->discount, $booking->delivery_fee, $booking->driver_fee, $booking->charges_total, $booking->total,
                    ]),
                    $booking->payment_method->label(), $booking->payment_status->label(),
                    number_format($booking->down_payment / 100, 2, '.', ''),
                    number_format($booking->security_deposit / 100, 2, '.', ''),
                    $booking->refund_amount !== null ? number_format($booking->refund_amount / 100, 2, '.', '') : '',
                    $booking->created_at?->toDateString(),
                ]);
            });
        });
    }

    /**
     * Every renter as a spreadsheet, matched the same way as the Renters page.
     */
    public function renters(Request $request, GroupRenters $groupRenters): StreamedResponse
    {
        $renters = $groupRenters->handle($request->user());

        return $this->csv('renters', ['Name', 'Mobile', 'Email', 'Other numbers', 'Bookings', 'Cancelled', 'Spent', 'Last trip', 'Flag'], function ($handle) use ($renters): void {
            foreach ($renters as $renter) {
                $latest = $renter['bookings']->first();
                fputcsv($handle, [
                    $latest->renter_name,
                    $latest->renter_phone,
                    $renter['bookings']->pluck('renter_email')->filter()->first(),
                    collect($renter['phone_keys'])->reject(fn (string $key): bool => $key === $renter['key'])->implode(' '),
                    $renter['bookings']->count(),
                    $renter['bookings']->where('status', BookingStatus::Cancelled)->count(),
                    number_format($renter['bookings']->whereIn('status', [BookingStatus::Confirmed, BookingStatus::Completed])->sum('total') / 100, 2, '.', ''),
                    $latest->start_date->toDateString(),
                    $renter['flag'],
                ]);
            }
        });
    }

    /**
     * @param  array<int, string>  $headings
     * @param  callable(resource): void  $rows
     */
    private function csv(string $name, array $headings, callable $rows): StreamedResponse
    {
        return response()->streamDownload(function () use ($headings, $rows): void {
            $handle = fopen('php://output', 'w');

            if ($handle === false) {
                return;
            }

            fputcsv($handle, $headings);
            $rows($handle);
            fclose($handle);
        }, "rentiva-{$name}-".now()->format('Y-m-d').'.csv', ['Content-Type' => 'text/csv']);
    }
}
