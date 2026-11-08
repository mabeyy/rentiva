<?php

namespace App\Http\Requests\Admin;

use App\Enums\CarStatus;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCarStatusRequest extends FormRequest
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
            'status' => ['required', Rule::enum(CarStatus::class)->only(CarStatus::moderationStatuses())],
            'reason' => [
                Rule::requiredIf(fn (): bool => $this->enum('status', CarStatus::class)?->requiresReason() ?? false),
                'nullable', 'string', 'max:500',
            ],
        ];
    }
}
