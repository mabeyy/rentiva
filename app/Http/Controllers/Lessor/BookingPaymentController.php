<?php

namespace App\Http\Controllers\Lessor;

use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Notifications\PaymentReviewed;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class BookingPaymentController extends Controller
{
    /**
     * Show the renter's transfer screenshot to the car's owner only.
     */
    public function proof(Booking $booking): StreamedResponse
    {
        Gate::authorize('update', $booking);
        abort_unless($booking->payment_proof_path && Storage::disk('local')->exists($booking->payment_proof_path), 404);

        return Storage::disk('local')->response($booking->payment_proof_path);
    }

    /**
     * Accept the transfer after checking it reached the owner's account.
     */
    public function approve(Booking $booking): RedirectResponse
    {
        Gate::authorize('update', $booking);
        abort_unless($booking->hasTransferToCheck(), 409);

        $booking->forceFill(['payment_status' => PaymentStatus::Paid, 'paid_at' => now()])->save();
        $booking->recordEvent('payment_approved', $booking->formattedTotal());
        $this->notifyRenter($booking);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Payment for :reference marked as paid.', ['reference' => $booking->reference])]);

        return back();
    }

    /**
     * Send the transfer back to the renter with a reason so they can resubmit.
     */
    public function reject(Request $request, Booking $booking): RedirectResponse
    {
        Gate::authorize('update', $booking);
        abort_unless($booking->hasTransferToCheck(), 409);

        $reason = $request->validate(['reason' => ['required', 'string', 'max:500']])['reason'];

        $booking->forceFill([
            'payment_status' => PaymentStatus::Rejected,
            'payment_rejection_reason' => $reason,
        ])->save();
        $booking->startTransferDeadline();
        $booking->recordEvent('payment_rejected', $reason);
        $this->notifyRenter($booking);

        Inertia::flash('toast', ['type' => 'success', 'message' => $booking->car->owner->planIncludes('email')
            ? __('The renter was asked to send the payment again.')
            : __('Payment sent back. Text the renter from the booking page so they know.')]);

        return back();
    }

    private function notifyRenter(Booking $booking): void
    {
        if ($booking->renter_email) {
            Notification::route('mail', [$booking->renter_email => $booking->renter_name])
                ->notify(new PaymentReviewed($booking));
        }
    }
}
