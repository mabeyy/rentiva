<?php

namespace App\Http\Controllers\Lessor;

use App\Enums\RenterCancellation;
use App\Http\Controllers\Controller;
use App\Http\Requests\Lessor\UpdatePoliciesRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PolicyController extends Controller
{
    /**
     * Show the lessor's booking, payment and data retention policies.
     */
    public function edit(Request $request): Response
    {
        $storefront = $request->user()->storefront;

        return Inertia::render('lessor/policies', [
            'policies' => $storefront ? [
                'renter_cancellation' => $storefront->renter_cancellation->value,
                ...$storefront->only(['cancellation_notice_hours', 'payment_policy', 'pickup_time', 'requires_license_photo', 'min_rental_days', 'advance_notice_hours', 'max_advance_days']),
                'data_retention_months' => $storefront->dataRetentionMonths(),
            ] : null,
            'cancellationOptions' => RenterCancellation::options(),
        ]);
    }

    /**
     * Save the lessor's policies.
     */
    public function update(UpdatePoliciesRequest $request): RedirectResponse
    {
        $request->user()->storefront->fill(array_filter(
            $request->validated(),
            fn (mixed $value, string $key): bool => $key !== 'cancellation_notice_hours' || $value !== null,
            ARRAY_FILTER_USE_BOTH,
        ))->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Policies saved.')]);

        return to_route('lessor.policies.edit');
    }
}
