<?php

namespace App\Http\Requests\Public;

use App\Enums\PaymentMethod;
use App\Models\Booking;
use App\Models\Car;
use App\Rules\Turnstile;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreBookingRequest extends FormRequest
{
    /**
     * The longest rental a guest can request in one booking.
     */
    public const int MAX_DAYS = 30;

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Normalize the email so guests can find their booking regardless of casing.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'renter_email' => Str::lower(trim((string) $this->input('renter_email'))),
            'payment_method' => $this->input('payment_method') ?? $this->acceptedPaymentMethods()[0]?->value,
            'with_delivery' => $this->boolean('with_delivery'),
            'with_driver' => $this->boolean('with_driver'),
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $startDate = $this->date('start_date') ?? today();

        return [
            'start_date' => ['required', 'date', 'after_or_equal:today'],
            'end_date' => ['required', 'date', 'after:start_date', 'before_or_equal:'.$startDate->addDays(self::MAX_DAYS)->toDateString()],
            'renter_name' => ['required', 'string', 'max:100'],
            'renter_email' => ['required', 'email', 'max:255'],
            'renter_phone' => ['required', 'string', 'regex:/^(\+63|0)9\d{9}$/'],
            'renter_license_number' => ['required', 'string', 'max:30'],
            'notes' => ['nullable', 'string', 'max:500'],
            'payment_method' => ['required', Rule::in(array_map(fn (PaymentMethod $method): string => $method->value, $this->acceptedPaymentMethods()))],
            'with_delivery' => ['boolean'],
            'delivery_address' => ['exclude_unless:with_delivery,true', 'required', 'string', 'max:255'],
            'with_driver' => ['boolean'],
            'license_photo' => [$this->car()->owner->storefront?->requires_license_photo ? 'required' : 'nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'accepted_terms' => ['accepted'],
            ...Turnstile::rules(),
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
            'payment_method.required' => __('Choose how you will pay.'),
            'payment_method.in' => __('The owner does not accept that payment method.'),
            'renter_phone.regex' => __('Enter a Philippine mobile number, e.g. 09171234567.'),
            'end_date.before_or_equal' => __('Bookings can be at most :days days long.', ['days' => self::MAX_DAYS]),
            'delivery_address.required' => __('Tell the owner where to deliver the car.'),
            'license_photo.required' => __('Add a photo of your driver\'s license.'),
        ];
    }

    /**
     * The payment methods the car's owner accepts; pay at pickup when they have
     * no booking page settings yet.
     *
     * @return array<int, PaymentMethod>
     */
    private function acceptedPaymentMethods(): array
    {
        return $this->car()->owner->storefront?->acceptedPaymentMethods() ?? [PaymentMethod::PayAtPickup];
    }

    /**
     * The owner's booking rules: shortest rental, notice before pickup, and
     * how far ahead renters can book.
     *
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [function (Validator $validator): void {
            $storefront = $this->car()->owner->storefront;

            if (! $storefront || $validator->errors()->hasAny(['start_date', 'end_date'])) {
                return;
            }

            $startDate = CarbonImmutable::parse($this->string('start_date'));
            $days = (int) $startDate->diffInDays(CarbonImmutable::parse($this->string('end_date')));
            $pickupAt = CarbonImmutable::parse("{$startDate->toDateString()} {$storefront->pickup_time}", Booking::PICKUP_TIMEZONE);

            if ($days < $storefront->min_rental_days) {
                $validator->errors()->add('end_date', trans_choice('Book at least :count day.|Book at least :count days.', $storefront->min_rental_days));
            } elseif ($storefront->advance_notice_hours > 0 && $pickupAt->lt(now()->addHours($storefront->advance_notice_hours))) {
                $validator->errors()->add('start_date', trans_choice('Book at least :count hour before pickup.|Book at least :count hours before pickup.', $storefront->advance_notice_hours));
            } elseif ($startDate->gt(today()->addDays($storefront->max_advance_days))) {
                $validator->errors()->add('start_date', __('Bookings open :days days ahead.', ['days' => $storefront->max_advance_days]));
            }
        }];
    }

    private function car(): Car
    {
        /** @var Car */
        return $this->route('car');
    }
}
