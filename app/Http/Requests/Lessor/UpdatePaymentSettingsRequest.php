<?php

namespace App\Http\Requests\Lessor;

use App\Models\PaymentAccount;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdatePaymentSettingsRequest extends FormRequest
{
    /**
     * Payment settings live on the booking page, so the lessor needs one.
     */
    public function authorize(): bool
    {
        return $this->user()->storefront !== null && ! $this->user()->isSuspended();
    }

    /**
     * Unchecked switches post "0" from the form; treat them as booleans.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'accepts_pay_at_pickup' => $this->boolean('accepts_pay_at_pickup'),
            'accepts_bank_transfer' => $this->boolean('accepts_bank_transfer'),
            ...($this->has('transfer_deadline_minutes') ? ['down_payment_enabled' => $this->boolean('down_payment_enabled') && $this->user()->planIncludes('down_payments')] : []),
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'accepts_pay_at_pickup' => ['boolean', 'accepted_if:accepts_bank_transfer,false'],
            'accepts_bank_transfer' => ['boolean'],
            'transfer_deadline_minutes' => ['sometimes', 'integer', 'between:5,10080'],
            'down_payment_enabled' => ['sometimes', 'boolean'],
            'down_payment_percent' => ['exclude_unless:down_payment_enabled,true', 'required', 'integer', 'between:10,90'],
            'accounts' => ['array', 'max:'.PaymentAccount::MAX_PER_STOREFRONT, Rule::requiredIf(fn (): bool => $this->boolean('accepts_bank_transfer') && $this->has('accounts'))],
            'accounts.*.id' => ['nullable', 'integer', Rule::exists('payment_accounts', 'id')->where('storefront_id', $this->user()->storefront?->id)],
            'accounts.*.bank_name' => ['required', 'string', 'max:80'],
            'accounts.*.account_name' => ['required', 'string', 'max:120'],
            'accounts.*.account_number' => ['required', 'string', 'max:40'],
            'accounts.*.qr' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'accepts_pay_at_pickup.accepted_if' => __('Accept at least one way to pay.'),
            'down_payment_percent.between' => __('Ask for between 10% and 90% upfront.'),
            'transfer_deadline_minutes.between' => __('Give renters between 5 minutes and 7 days (10,080 minutes) to transfer.'),
            'accounts.required' => __('Add at least one account renters can transfer to.'),
            'accounts.max' => __('You can add up to :max accounts.', ['max' => PaymentAccount::MAX_PER_STOREFRONT]),
            'accounts.*.bank_name.required' => __('Enter the bank or e-wallet.'),
            'accounts.*.account_name.required' => __('Enter the name on the account.'),
            'accounts.*.account_number.required' => __('Enter the account number.'),
        ];
    }

    /**
     * Every transfer account needs a QR code renters can scan: new accounts
     * must upload one, and saved accounts without one must add it.
     *
     * @return array<int, Closure(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $savedWithQr = PaymentAccount::query()
                    ->where('storefront_id', $this->user()->storefront?->id)
                    ->whereNotNull('qr_path')
                    ->pluck('id');

                foreach ((array) $this->input('accounts', []) as $index => $account) {
                    $hasSavedQr = isset($account['id']) && $savedWithQr->contains((int) $account['id']);

                    if (! $this->hasFile("accounts.{$index}.qr") && ! $hasSavedQr) {
                        $validator->errors()->add("accounts.{$index}.qr", __('Add the QR code renters scan to pay.'));
                    }
                }
            },
        ];
    }
}
