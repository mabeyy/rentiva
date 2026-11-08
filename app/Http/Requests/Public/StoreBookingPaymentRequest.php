<?php

namespace App\Http\Requests\Public;

use App\Models\Booking;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreBookingPaymentRequest extends FormRequest
{
    /**
     * Only a confirmed bank-transfer booking without an accepted transfer takes
     * a submission. The signed URL already proves the guest holds the link.
     */
    public function authorize(): bool
    {
        /** @var Booking $booking */
        $booking = $this->route('booking');

        return $booking->awaitsTransfer();
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
