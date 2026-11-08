<?php

namespace App\Http\Requests\Lessor;

use App\Models\Storefront;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class UpdateStorefrontRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return ! $this->user()->isSuspended();
    }

    /**
     * Normalize the slug ("ABQ Car Rental" → "abq-car-rental") and the unchecked-switch value.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'slug' => Str::slug((string) $this->input('slug')),
            'listed_in_directory' => $this->boolean('listed_in_directory'),
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:80'],
            'slug' => [
                'required', 'string', 'min:3', 'max:40', 'alpha_dash:ascii',
                Rule::unique('storefronts')->ignore($this->user()->storefront),
                function (string $attribute, mixed $value, Closure $fail): void {
                    if (Storefront::isReservedSlug((string) $value)) {
                        $fail(__('That address is reserved. Please choose another.'));
                    }
                },
            ],
            'listed_in_directory' => ['boolean'],
            'tagline' => ['nullable', 'string', 'max:120'],
            'about' => ['nullable', 'string', 'max:2000'],
            'main_pickup_location_id' => ['nullable', 'integer', Rule::exists('pickup_locations', 'id')->where('owner_id', $this->user()->id)],
            'phone' => ['nullable', 'string', 'regex:/^(\+63|0)9\d{9}$/'],
            'facebook_url' => ['nullable', 'url:https', 'max:255', 'regex:#^https://(www\.|m\.|web\.)?(facebook|fb)\.com/.+#i'],
            'instagram_url' => ['nullable', 'url:https', 'max:255', 'regex:#^https://(www\.)?instagram\.com/.+#i'],
            'tiktok_url' => ['nullable', 'url:https', 'max:255', 'regex:#^https://(www\.)?tiktok\.com/.+#i'],
            'logo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'brand_color' => ['nullable', 'hex_color', 'size:7'],
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
            'slug.unique' => __('That booking page address is already taken.'),
            'phone.regex' => __('Enter a Philippine mobile number, e.g. 09171234567.'),
            'facebook_url.regex' => __('Enter a link to your Facebook page, e.g. https://facebook.com/yourpage.'),
            'instagram_url.regex' => __('Enter a link to your Instagram profile, e.g. https://instagram.com/yourname.'),
            'tiktok_url.regex' => __('Enter a link to your TikTok profile, e.g. https://tiktok.com/@yourname.'),
            'brand_color.hex_color' => __('Choose a color like #E8622A.'),
            'brand_color.size' => __('Choose a color like #E8622A.'),
        ];
    }
}
