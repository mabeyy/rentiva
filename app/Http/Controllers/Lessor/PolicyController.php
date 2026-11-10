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
                'default_weekly_discount' => $storefront->default_weekly_discount,
                'default_monthly_discount' => $storefront->default_monthly_discount,
                'default_delivery_fee' => self::pesos($storefront->default_delivery_fee),
                'default_driver_daily_rate' => self::pesos($storefront->default_driver_daily_rate),
                'default_deposit_percent' => $storefront->default_deposit_percent,
                'damage_participation_fee' => self::pesos($storefront->damage_participation_fee),
                'damage_policy' => $storefront->damage_policy,
                'cars_with_own_extras' => $request->user()->cars()->where('custom_extras', true)->count(),
            ] : null,
            'cancellationOptions' => RenterCancellation::options(),
        ]);
    }

    /**
     * Save the lessor's policies.
     */
    public function update(UpdatePoliciesRequest $request): RedirectResponse
    {
        $data = $request->validated();

        foreach (['default_delivery_fee', 'default_driver_daily_rate', 'damage_participation_fee'] as $key) {
            if (array_key_exists($key, $data)) {
                // Pesos to centavos. Blank stays empty: not offered, or no fee.
                $data[$key] = $data[$key] === null || $data[$key] === '' ? null : (int) round((float) $data[$key] * 100);
            }
        }

        foreach (['default_weekly_discount', 'default_monthly_discount', 'default_deposit_percent'] as $key) {
            if (array_key_exists($key, $data)) {
                $data[$key] = (int) ($data[$key] ?? 0);
            }
        }

        $storefront = $request->user()->storefront;
        $storefront->fill(array_filter(
            $data,
            fn (mixed $value, string $key): bool => $key !== 'cancellation_notice_hours' || $value !== null,
            ARRAY_FILTER_USE_BOTH,
        ))->save();
        $storefront->applyDefaultExtrasToCars();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Policies saved.')]);

        return to_route('lessor.policies.edit');
    }

    /**
     * Centavos to pesos for a form field, keeping "not offered" as null.
     */
    private static function pesos(?int $centavos): ?string
    {
        return $centavos === null ? null : (string) ($centavos / 100);
    }
}
