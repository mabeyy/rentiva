<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Translation\PotentiallyTranslatedString;

/**
 * Checks a Cloudflare Turnstile token, so bots can't spam public forms.
 * Turned off until both Turnstile keys are set.
 */
class Turnstile implements ValidationRule
{
    /**
     * The form field the Turnstile widget fills in.
     */
    public const string FIELD = 'cf-turnstile-response';

    /**
     * Run even when the field is missing, so an empty token fails too.
     */
    public bool $implicit = true;

    /**
     * Whether both Turnstile keys are set.
     */
    public static function isEnabled(): bool
    {
        return filled(config('services.turnstile.site_key')) && filled(config('services.turnstile.secret_key'));
    }

    /**
     * The validation rules for the widget's field, keyed by field name.
     *
     * @return array<string, array<int, mixed>>
     */
    public static function rules(): array
    {
        return self::isEnabled() ? [self::FIELD => [new self]] : [];
    }

    /**
     * Run the validation rule.
     *
     * @param  Closure(string, ?string=): PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || $value === '') {
            $fail(__('Please confirm you\'re not a robot.'));

            return;
        }

        try {
            $passed = Http::asForm()
                ->timeout(5)
                ->post('https://challenges.cloudflare.com/turnstile/v0/siteverify', [
                    'secret' => config('services.turnstile.secret_key'),
                    'response' => $value,
                    'remoteip' => request()->ip(),
                ])
                ->json('success') === true;
        } catch (ConnectionException) {
            $passed = false;
        }

        if (! $passed) {
            $fail(__('We couldn\'t confirm you\'re not a robot. Please try again.'));
        }
    }
}
