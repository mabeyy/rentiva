<?php

namespace App\Http\Requests\Lessor;

use App\Models\Car;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateCarRequest extends StoreCarRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->car());
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            ...parent::rules(),
            'images' => ['array', 'max:'.self::MAX_IMAGES],
            'removed_image_ids' => ['array'],
            'removed_image_ids.*' => ['integer', Rule::exists('car_images', 'id')->where('car_id', $this->car()->id)],
        ];
    }

    /**
     * Ensure the listing keeps between one and the maximum number of photos.
     *
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $remaining = $this->car()->images()->count()
                    - count($this->input('removed_image_ids', []))
                    + count($this->file('images', []));

                if ($remaining < 1 || $remaining > self::MAX_IMAGES) {
                    $validator->errors()->add('images', __('A listing needs between 1 and :max photos.', ['max' => self::MAX_IMAGES]));
                }
            },
        ];
    }

    /**
     * Get the car being updated.
     */
    private function car(): Car
    {
        $car = $this->route('car');

        abort_unless($car instanceof Car, 404);

        return $car;
    }
}
