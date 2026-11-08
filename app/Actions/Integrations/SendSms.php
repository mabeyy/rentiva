<?php

namespace App\Actions\Integrations;

use App\Models\Booking;
use App\Models\NotificationLog;
use App\Models\Storefront;
use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * Sends a text through the owner's own Semaphore account and logs the outcome.
 * Failures are recorded, never thrown, so a text can't break a booking.
 */
class SendSms
{
    public const string ENDPOINT = 'https://api.semaphore.co/api/v4/messages';

    /**
     * Send using the owner's saved credentials. Returns whether it went through.
     */
    public function handle(Storefront $storefront, string $to, string $message, ?Booking $booking = null): bool
    {
        if (! $storefront->sms_enabled || blank($storefront->semaphore_api_key) || ! $storefront->owner->planIncludes('sms')) {
            return false;
        }

        return $this->deliver((string) $storefront->semaphore_api_key, $storefront->sms_sender_name, $to, $message, $booking, $storefront);
    }

    /**
     * Send with explicit (possibly unsaved) credentials, e.g. a test from the settings page.
     */
    public function deliver(string $apiKey, ?string $sender, string $to, string $message, ?Booking $booking = null, ?Storefront $storefront = null): bool
    {
        $number = self::normalize($to);

        if ($number === null) {
            NotificationLog::record($booking, 'sms', $to, $message, false, __('Not a valid Philippine mobile number.'), $storefront);

            return false;
        }

        try {
            $response = Http::asForm()->timeout(15)->post(self::ENDPOINT, array_filter([
                'apikey' => $apiKey,
                'number' => $number,
                'message' => $message,
                'sendername' => $sender,
            ]));

            $sent = $response->successful() && ! isset($response->json()['error']);
            NotificationLog::record($booking, 'sms', $number, $message, $sent, $sent ? null : $response->body(), $storefront);

            return $sent;
        } catch (Throwable $exception) {
            NotificationLog::record($booking, 'sms', $number, $message, false, $exception->getMessage(), $storefront);

            return false;
        }
    }

    /**
     * A Philippine mobile number in 09XXXXXXXXX form, or null when it isn't one.
     */
    public static function normalize(string $phone): ?string
    {
        $digits = preg_replace('/\D/', '', $phone) ?? '';

        if (str_starts_with($digits, '63') && strlen($digits) === 12) {
            $digits = '0'.substr($digits, 2);
        }

        return preg_match('/^09\d{9}$/', $digits) === 1 ? $digits : null;
    }
}
