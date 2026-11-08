<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'data_retention_months' => ['required', 'integer', 'between:1,120'],
            'proof_retention_days' => ['required', 'integer', 'between:1,365'],
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
            'data_retention_months.between' => __('Keep renter details for 1 to 120 months.'),
            'proof_retention_days.between' => __('Keep screenshots for 1 to 365 days.'),
        ];
    }
}
