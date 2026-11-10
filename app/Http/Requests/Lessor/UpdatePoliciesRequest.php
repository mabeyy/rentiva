<?php

namespace App\Http\Requests\Lessor;

use App\Enums\RenterCancellation;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePoliciesRequest extends FormRequest
{
    /**
     * Policies live on the booking page, so the lessor needs one.
     */
    public function authorize(): bool
    {
        return $this->user()->storefront !== null && ! $this->user()->isSuspended();
    }

    /**
     * An unchecked switch sends nothing; treat that as off.
     */
    protected function prepareForValidation(): void
    {
        $this->merge(['requires_license_photo' => $this->boolean('requires_license_photo')]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'renter_cancellation' => ['required', Rule::enum(RenterCancellation::class)],
            'cancellation_notice_hours' => ['required_if:renter_cancellation,notice', 'nullable', 'integer', 'between:1,336'],
            'payment_policy' => ['nullable', 'string', 'max:2000'],
            'damage_participation_fee' => ['sometimes', 'nullable', 'numeric', 'between:0,200000'],
            'damage_policy' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'pickup_time' => ['sometimes', 'date_format:H:i'],
            'requires_license_photo' => ['boolean'],
            'min_rental_days' => ['sometimes', 'integer', 'between:1,30'],
            'advance_notice_hours' => ['sometimes', 'integer', 'between:0,168'],
            'max_advance_days' => ['sometimes', 'integer', 'between:7,730'],
            'default_weekly_discount' => ['sometimes', 'nullable', 'integer', 'between:0,50'],
            'default_monthly_discount' => ['sometimes', 'nullable', 'integer', 'between:0,70'],
            'default_delivery_fee' => ['sometimes', 'nullable', 'numeric', 'between:0,20000'],
            'default_driver_daily_rate' => ['sometimes', 'nullable', 'numeric', 'between:0,20000'],
            'default_deposit_percent' => ['sometimes', 'nullable', 'integer', 'between:0,100'],
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
            'cancellation_notice_hours.between' => __('Choose between 1 hour and 14 days (336 hours).'),
        ];
    }
}
