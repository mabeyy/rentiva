<?php

namespace App\Http\Requests\Public;

use App\Models\Booking;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreBookingPaymentRequest extends FormRequest
{
    /**
     * The signed URL already proves the guest holds the link. Whether the
     * booking still takes a transfer is checked in the controller, so a
     * second tab gets a friendly message instead of an error page.
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
            'payment_reference' => ['required', 'string', 'max:60'],
            'payment_proof' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
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
            'payment_reference.required' => __('Enter the reference number from your bank or e-wallet.'),
            'payment_proof.required' => __('Attach a screenshot of the transfer.'),
        ];
    }
}
