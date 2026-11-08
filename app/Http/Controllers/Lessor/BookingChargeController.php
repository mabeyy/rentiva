<?php

namespace App\Http\Controllers\Lessor;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\BookingCharge;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Number;
use Inertia\Inertia;

class BookingChargeController extends Controller
{
    /** Common charges offered as one-tap labels. */
    public const array SUGGESTED_LABELS = ['Late return', 'Fuel top-up', 'Cleaning', 'Tolls', 'Damage', 'Extra day'];

    /**
     * Add a charge to the bill, such as a late return or damage.
     */
    public function store(Request $request, Booking $booking): RedirectResponse
    {
        Gate::authorize('update', $booking);

        $data = $request->validate([
            'label' => ['required', 'string', 'max:80'],
            'amount' => ['required', 'numeric', 'min:1', 'max:500000'],
        ]);

        $charge = $booking->charges()->create(['label' => $data['label'], 'amount' => (int) round($data['amount'] * 100)]);
        $booking->recalculateTotal();
        $booking->save();
        $booking->recordEvent('charged', "{$charge->label} · ".Number::currency($charge->amount / 100, 'PHP', 'en_PH'));

        return $this->saved(__('Charge added.'));
    }

    /**
     * Remove a charge added by mistake.
     */
    public function destroy(Booking $booking, BookingCharge $charge): RedirectResponse
    {
        Gate::authorize('update', $booking);
        abort_unless($charge->booking_id === $booking->id, 404);

        $charge->delete();
        $booking->recalculateTotal();
        $booking->save();

        return $this->saved(__('Charge removed.'));
    }

    private function saved(string $message): RedirectResponse
    {
        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return back();
    }
}
