<?php

namespace App\Http\Controllers\Lessor;

use App\Http\Controllers\Controller;
use App\Http\Requests\Lessor\UpdatePaymentSettingsRequest;
use App\Http\Resources\PaymentAccountResource;
use App\Models\PaymentAccount;
use App\Models\Storefront;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PaymentSettingController extends Controller
{
    /**
     * Show the payment methods the lessor accepts and their transfer accounts.
     */
    public function edit(Request $request): Response
    {
        $storefront = $request->user()->storefront;

        return Inertia::render('lessor/payments', [
            'settings' => $storefront ? [
                ...$storefront->only(['accepts_pay_at_pickup', 'accepts_bank_transfer', 'transfer_deadline_minutes', 'down_payment_enabled', 'down_payment_percent']),
                'down_payment_included' => $request->user()->planIncludes('down_payments'),
                'accounts' => PaymentAccountResource::collection($storefront->paymentAccounts()->get())->resolve(),
            ] : null,
        ]);
    }

    /**
     * Save which payment methods renters may use and where transfers go.
     */
    public function update(UpdatePaymentSettingsRequest $request): RedirectResponse
    {
        $storefront = $request->user()->storefront;
        $storefront->fill($request->safe()->only([
            'accepts_pay_at_pickup', 'accepts_bank_transfer', 'transfer_deadline_minutes', 'down_payment_enabled', 'down_payment_percent',
        ]))->save();

        // The account fields are only sent while bank transfer is switched on;
        // turning it off keeps the saved accounts for next time.
        if ($request->has('accounts')) {
            $this->syncAccounts($request, $storefront);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Payment settings saved.')]);

        return to_route('lessor.payments.edit');
    }

    /**
     * Save the submitted accounts in order, with any new QR codes, and remove
     * the ones the owner deleted.
     */
    private function syncAccounts(UpdatePaymentSettingsRequest $request, Storefront $storefront): void
    {
        $keptIds = collect($request->safe()->array('accounts'))->map(function (array $data, int $index) use ($request, $storefront): int {
            $account = isset($data['id'])
                ? $storefront->paymentAccounts()->whereKey($data['id'])->firstOrFail()
                : $storefront->paymentAccounts()->make();

            $account->fill([...Arr::only($data, ['bank_name', 'account_name', 'account_number']), 'position' => $index]);

            if ($request->hasFile("accounts.{$index}.qr")) {
                if ($account->qr_path) {
                    Storage::disk('public')->delete($account->qr_path);
                }

                $account->qr_path = $request->file("accounts.{$index}.qr")->store('payment-qr', 'public') ?: null;
            }

            $account->save();

            return $account->id;
        });

        $storefront->paymentAccounts()->whereNotIn('id', $keptIds)->get()->each(function (PaymentAccount $account): void {
            if ($account->qr_path) {
                Storage::disk('public')->delete($account->qr_path);
            }

            $account->delete();
        });
    }
}
