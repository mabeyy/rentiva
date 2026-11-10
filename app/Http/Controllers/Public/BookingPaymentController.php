<?php

namespace App\Http\Controllers\Public;

use App\Actions\Images\StoreOptimizedImage;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Public\StoreBookingPaymentRequest;
use App\Models\Booking;
use App\Notifications\PaymentSubmitted;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class BookingPaymentController extends Controller
{
    /**
     * Record the guest's bank transfer for the owner to check.
     */
    public function store(StoreBookingPaymentRequest $request, Booking $booking, StoreOptimizedImage $storeOptimizedImage): RedirectResponse
    {
        if (! $booking->awaitsTransfer()) {
            Inertia::flash('toast', ['type' => 'info', 'message' => __('This payment was already sent, or the booking no longer takes one.')]);

            return redirect()->to($booking->manageUrl());
        }

        $path = $storeOptimizedImage->handle($request->file('payment_proof'), 'payment-proofs', 'local', StoreOptimizedImage::DOCUMENT, 85);

        if ($booking->payment_proof_path) {
            Storage::disk('local')->delete($booking->payment_proof_path);
        }

        $booking->forceFill([
            'payment_status' => PaymentStatus::Submitted,
            'payment_reference' => $request->validated('payment_reference'),
            'payment_proof_path' => $path,
            'payment_rejection_reason' => null,
            'payment_submitted_at' => now(),
        ])->save();

        $booking->recordEvent('payment_submitted', __('Reference :reference', ['reference' => $booking->payment_reference]));
        $booking->car->owner->notify(new PaymentSubmitted($booking));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Payment sent. The owner will check it and let you know.')]);

        return redirect()->to($booking->manageUrl());
    }
}
