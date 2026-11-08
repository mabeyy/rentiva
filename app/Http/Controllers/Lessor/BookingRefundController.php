<?php

namespace App\Http\Controllers\Lessor;

use App\Enums\BookingStatus;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Notifications\RefundRecorded;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Number;
use Inertia\Inertia;

class BookingRefundController extends Controller
{
    /**
     * Record what went back to the renter after a paid booking was cancelled
     * or declined. Keeping part needs a reason, which the renter sees.
     */
    public function update(Request $request, Booking $booking): RedirectResponse
    {
        Gate::authorize('update', $booking);
        abort_unless(in_array($booking->status, [BookingStatus::Cancelled, BookingStatus::Declined], true) && $booking->amountPaid() > 0, 404);

        $paid = $booking->amountPaid() / 100;
        $data = $request->validate([
            'amount' => ['required', 'numeric', 'min:0', 'max:'.$paid],
            'reference' => ['nullable', 'string', 'max:60'],
            'note' => ['nullable', 'required_unless:amount,'.$paid, 'string', 'max:255'],
        ], [
            'note.required_unless' => __('Say why part of the payment was kept.'),
        ]);

        $amount = (int) round($data['amount'] * 100);
        $booking->forceFill([
            'refund_amount' => $amount,
            'refunded_at' => now(),
            'refund_reference' => $data['reference'] ?? null,
            'refund_note' => $data['note'] ?? null,
        ])->save();

        $booking->recordEvent('refunded', collect([
            Number::currency($amount / 100, 'PHP', 'en_PH').' refunded',
            $data['note'] ?? null,
        ])->filter()->implode(' · '));

        if ($booking->renter_email) {
            Notification::route('mail', [$booking->renter_email => $booking->renter_name])->notify(new RefundRecorded($booking));
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Refund recorded.')]);

        return back();
    }
}
