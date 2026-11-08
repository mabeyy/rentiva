<?php

namespace App\Http\Requests\Lessor;

use App\Enums\BookingSource;
use App\Enums\PaymentMethod;
use App\Http\Requests\Public\StoreBookingRequest;
use App\Models\Car;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreManualBookingRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->storefront !== null && ! $this->user()->isSuspended();
    }

    /**
     * Unchecked boxes send nothing; treat them as off.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'renter_email' => $this->filled('renter_email') ? strtolower(trim((string) $this->input('renter_email'))) : null,
            'with_delivery' => $this->boolean('with_delivery'),
            'with_driver' => $this->boolean('with_driver'),
            'is_paid' => $this->boolean('is_paid'),
        ]);
    }

    /**
     * Get the validation rules that apply to the request. Email and license
     * are optional: a phone or walk-in booking may not have them yet.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $startDate = $this->date('start_date') ?? today();

        return [
            'car' => ['required', 'string', Rule::exists('cars', 'slug')->where('owner_id', $this->user()->id)],
            'start_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'end_date' => ['required', 'date_format:Y-m-d', 'after:start_date', 'before_or_equal:'.$startDate->addDays(StoreBookingRequest::MAX_DAYS)->toDateString()],
            'renter_name' => ['required', 'string', 'max:100'],
            'renter_phone' => ['required', 'string', 'regex:/^(\+63|0)9\d{9}$/'],
            'renter_email' => ['nullable', 'email', 'max:255'],
            'renter_license_number' => ['nullable', 'string', 'max:30'],
            'license_photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'source' => ['required', Rule::in(array_column(BookingSource::manualOptions(), 'value'))],
            'payment_method' => ['required', Rule::enum(PaymentMethod::class)],
            'is_paid' => ['boolean'],
            'with_delivery' => ['boolean'],
            'delivery_address' => ['exclude_unless:with_delivery,true', 'required', 'string', 'max:255'],
            'with_driver' => ['boolean'],
            'notes' => ['nullable', 'string', 'max:500'],
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
            'car.required' => __('Choose a car.'),
            'car.exists' => __('Choose one of your cars.'),
            'renter_phone.regex' => __('Enter a Philippine mobile number, e.g. 09171234567.'),
            'delivery_address.required' => __('Add where to deliver the car.'),
            'end_date.before_or_equal' => __('Bookings can be at most :days days long.', ['days' => StoreBookingRequest::MAX_DAYS]),
        ];
    }

    /**
     * The chosen car.
     */
    public function car(): Car
    {
        return $this->user()->cars()->where('slug', $this->validated('car'))->firstOrFail();
    }
}
