<?php

namespace App\Http\Requests\Lessor;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSupportRequestRequest extends FormRequest
{
    /**
     * What an owner can ask about, with a label for each.
     */
    public const array TOPICS = [
        'bookings' => 'Bookings and payments',
        'cars' => 'Cars and listings',
        'booking_page' => 'Booking page and branding',
        'billing' => 'My plan and billing',
        'bug' => "Something isn't working",
        'other' => 'Something else',
    ];

    /** Fewest characters a message needs, so support has enough to go on. */
    public const int MESSAGE_MIN = 20;

    /** Most characters a message can have. */
    public const int MESSAGE_MAX = 3000;

    /**
     * Anyone on the team can ask for help.
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
            'topic' => ['required', Rule::in(array_keys(self::TOPICS))],
            'reference' => ['nullable', 'string', 'max:60'],
            'message' => ['required', 'string', 'min:'.self::MESSAGE_MIN, 'max:'.self::MESSAGE_MAX],
            'screenshot' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
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
            'message.min' => __('Tell us a little more so we can help (at least :min characters).'),
        ];
    }
}
