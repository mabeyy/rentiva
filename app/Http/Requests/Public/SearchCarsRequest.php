<?php

namespace App\Http\Requests\Public;

use App\Enums\BodyType;
use App\Enums\FuelType;
use App\Enums\Transmission;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SearchCarsRequest extends FormRequest
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
            'search' => ['nullable', 'string', 'max:100'],
            'body_type' => ['nullable', Rule::enum(BodyType::class)],
            'transmission' => ['nullable', Rule::enum(Transmission::class)],
            'fuel_type' => ['nullable', Rule::enum(FuelType::class)],
            'seats' => ['nullable', 'integer', 'between:2,15'],
            'location' => ['nullable', 'string', 'max:100'],
            'max_rate' => ['nullable', 'integer', 'min:1'],
            'start_date' => ['nullable', 'required_with:end_date', 'date', 'after_or_equal:today'],
            'end_date' => ['nullable', 'required_with:start_date', 'date', 'after:start_date'],
            'sort' => ['nullable', Rule::in(['newest', 'price_asc', 'price_desc'])],
        ];
    }
}
