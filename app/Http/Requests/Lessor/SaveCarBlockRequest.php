<?php

namespace App\Http\Requests\Lessor;

use App\Enums\BlockReason;
use App\Models\Booking;
use App\Models\Car;
use App\Models\CarBlock;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class SaveCarBlockRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Gate::allows('update', $this->route('car'));
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'start_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'end_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:start_date', 'before_or_equal:start_date +1 year'],
            'reason' => ['required', Rule::enum(BlockReason::class)],
            'note' => ['nullable', 'string', 'max:120'],
        ];
    }

    /**
     * Blocked days can't cover a booking renters already hold, or another block.
     *
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            /** @var Car $car */
            $car = $this->route('car');
            $block = $this->route('block');
            $startDate = CarbonImmutable::parse($this->string('start_date'));
            $endDate = CarbonImmutable::parse($this->string('end_date'));

            $booking = $car->bookings()->reserving()->overlapping($startDate, $endDate->addDay())->oldest('start_date')->first();

            if ($booking instanceof Booking) {
                $validator->errors()->add('start_date', __('Booking :reference (:renter) has the car on some of these days. Cancel or move it first.', [
                    'reference' => $booking->reference,
                    'renter' => $booking->renter_name,
                ]));

                return;
            }

            $clashesWithBlock = $car->blocks()
                ->when($block instanceof CarBlock, fn ($query) => $query->whereKeyNot($block->id))
                ->whereDate('start_date', '<=', $endDate)
                ->whereDate('end_date', '>=', $startDate)
                ->exists();

            if ($clashesWithBlock) {
                $validator->errors()->add('start_date', __('Some of these days are already blocked.'));
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
            'start_date.after_or_equal' => __('Blocked days can\'t be in the past.'),
            'end_date.before_or_equal' => __('Block up to a year at a time.'),
        ];
    }
}
