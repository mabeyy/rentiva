<?php

namespace App\Http\Controllers\Lessor;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Number;
use Inertia\Inertia;

class BookingDepositController extends Controller
{
    /**
     * Record the deposit as collected at pickup, or returned (in full or in
     * part, with why the rest was kept).
     */
    public function update(Request $request, Booking $booking): RedirectResponse
    {
        Gate::authorize('update', $booking);
        abort_if($booking->security_deposit === 0, 404);

        $data = $request->validate([
            'action' => ['required', 'in:collected,returned'],
            'returned_amount' => ['required_if:action,returned', 'nullable', 'numeric', 'min:0', 'max:'.$booking->security_deposit / 100],
            'note' => ['exclude_unless:action,returned', 'nullable', 'required_unless:returned_amount,'.$booking->security_deposit / 100, 'string', 'max:255'],
        ], [
            'note.required_unless' => __('Say why part of the deposit was kept.'),
        ]);

        if ($data['action'] === 'collected') {
            $booking->forceFill(['deposit_collected_at' => now()])->save();
            $booking->recordEvent('deposit_collected');

            return $this->saved(__('Deposit marked as collected.'));
        }

        $returned = (int) round($data['returned_amount'] * 100);
        $booking->forceFill([
            'deposit_collected_at' => $booking->deposit_collected_at ?? now(),
            'deposit_returned_amount' => $returned,
            'deposit_returned_at' => now(),
            'deposit_note' => $returned < $booking->security_deposit ? $data['note'] : null,
        ])->save();

        $booking->recordEvent('deposit_returned', collect([
            Number::currency($returned / 100, 'PHP', 'en_PH').' returned',
            $returned < $booking->security_deposit ? $data['note'] : null,
        ])->filter()->implode(' · '));

        return $this->saved(__('Deposit return recorded.'));
    }

    private function saved(string $message): RedirectResponse
    {
        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return back();
    }
}
