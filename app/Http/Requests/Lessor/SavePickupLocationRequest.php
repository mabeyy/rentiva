<?php

namespace App\Http\Requests\Lessor;

use App\Models\PickupLocation;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class SavePickupLocationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $pickupLocation = $this->route('pickup_location');

        return $pickupLocation instanceof PickupLocation
            ? $this->user()->can('update', $pickupLocation)
            : $this->user()->can('create', PickupLocation::class);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'address' => ['required', 'string', 'max:160'],
            'city' => ['required', 'string', 'max:80'],
        ];
    }
}
