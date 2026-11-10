<?php

namespace App\Http\Requests\Lessor;

use App\Enums\BodyType;
use App\Enums\Drivetrain;
use App\Enums\FeatureVehicle;
use App\Enums\FuelType;
use App\Enums\Transmission;
use App\Models\Car;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreCarRequest extends FormRequest
{
    /**
     * The maximum number of photos a listing may have.
     */
    public const int MAX_IMAGES = 10;

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('create', Car::class);
    }

    /**
     * Two-wheelers have no doors or drivetrain, so drop any values a form sent for them.
     */
    protected function prepareForValidation(): void
    {
        if ($this->isTwoWheeler()) {
            $this->merge(['doors' => null, 'drivetrain' => null]);
        }

        // An unchecked switch sends nothing; treat that as following the defaults.
        $this->merge(['custom_extras' => $this->boolean('custom_extras')]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'make' => ['required', 'string', 'max:50'],
            'model' => ['required', 'string', 'max:50'],
            'year' => ['required', 'integer', 'min:1990', 'max:'.(now()->year + 1)],
            'body_type' => ['required', Rule::enum(BodyType::class)],
            'transmission' => ['required', Rule::enum(Transmission::class)],
            'fuel_type' => ['required', Rule::enum(FuelType::class)],
            'drivetrain' => [Rule::requiredIf(! $this->isTwoWheeler()), 'nullable', Rule::enum(Drivetrain::class)],
            'seats' => ['required', 'integer', $this->isTwoWheeler() ? 'between:1,2' : 'between:2,15'],
            'doors' => [Rule::requiredIf(! $this->isTwoWheeler()), 'nullable', 'integer', 'between:2,5'],
            'luggage_capacity' => ['required', 'integer', 'between:0,10'],
            'fuel_economy_city' => ['nullable', 'numeric', 'between:1,60'],
            'fuel_economy_highway' => ['nullable', 'numeric', 'between:1,60'],
            'exterior_color' => ['required', 'string', 'max:30'],
            'pickup_location_id' => ['required', 'integer', Rule::exists('pickup_locations', 'id')->where('owner_id', $this->user()->id)],
            'description' => ['nullable', 'string', 'max:2000'],
            'daily_rate' => ['required', 'numeric', 'between:300,100000'],
            'custom_extras' => ['boolean'],
            'deposit_percent' => ['nullable', 'integer', 'between:0,100'],
            'weekly_discount' => ['nullable', 'integer', 'between:0,50'],
            'monthly_discount' => ['nullable', 'integer', 'between:0,70'],
            'delivery_fee' => ['nullable', 'numeric', 'between:0,20000'],
            'driver_daily_rate' => ['nullable', 'numeric', 'between:0,20000'],
            'plate_number' => ['nullable', 'string', 'max:15'],
            'registration_expires_on' => ['nullable', 'date_format:Y-m-d'],
            'features' => ['array'],
            // Only features that fit the vehicle, e.g. no Apple CarPlay on a scooter.
            'features.*' => ['integer', Rule::exists('features', 'id')->whereIn('vehicles', [FeatureVehicle::All->value, $this->isTwoWheeler() ? FeatureVehicle::TwoWheelers->value : FeatureVehicle::Cars->value])],
            'images' => ['required', 'array', 'min:1', 'max:'.self::MAX_IMAGES],
            'images.*' => ['image', 'mimes:jpg,jpeg,png,webp', 'max:10240'],
        ];
    }

    /**
     * New listings stop at the owner's plan limit.
     *
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [function (Validator $validator): void {
            $limit = $this->user()->planLimit('max_cars');

            if ($this->route('car') === null && $limit !== null && $this->user()->cars()->count() >= $limit) {
                $validator->errors()->add('make', __('Your plan allows :count cars. Upgrade under Billing to add more.', ['count' => $limit]));
            }
        }];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'pickup_location_id.required' => __('Choose where renters pick this car up.'),
            'pickup_location_id.exists' => __('Choose one of your pickup locations.'),
        ];
    }

    /**
     * Whether the submitted body type is a scooter or motorcycle.
     */
    protected function isTwoWheeler(): bool
    {
        return BodyType::tryFrom((string) $this->input('body_type'))?->isTwoWheeler() ?? false;
    }
}
