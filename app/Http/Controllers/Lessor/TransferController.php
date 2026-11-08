<?php

namespace App\Http\Controllers\Lessor;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\BookingResource;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class TransferController extends Controller
{
    /**
     * The bank transfers renters sent: the queue waiting to be checked (oldest
     * first, so nobody waits longest), or the history of paid and rejected ones.
     */
    public function __invoke(Request $request): Response
    {
        $tab = $request->validate([
            'tab' => ['nullable', Rule::in(['to-check', 'history'])],
        ])['tab'] ?? 'to-check';

        $transfers = fn () => $request->user()->bookings()
            ->where('payment_method', PaymentMethod::BankTransfer)
            ->with('car.coverImage');

        return Inertia::render('lessor/transfers', [
            'tab' => $tab,
            'counts' => [
                'toCheck' => $transfers()->where('payment_status', PaymentStatus::Submitted)->count(),
                'history' => $transfers()->whereIn('payment_status', [PaymentStatus::Paid, PaymentStatus::Rejected])->count(),
            ],
            'transfers' => $tab === 'to-check'
                ? BookingResource::collection($transfers()->where('payment_status', PaymentStatus::Submitted)->oldest('payment_submitted_at')->get())
                : BookingResource::collection(
                    $transfers()
                        ->whereIn('payment_status', [PaymentStatus::Paid, PaymentStatus::Rejected])
                        ->latest('payment_submitted_at')
                        ->paginate(20)
                        ->withQueryString(),
                ),
        ]);
    }
}
