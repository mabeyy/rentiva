<?php

namespace App\Actions\Integrations;

use App\Models\Storefront;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Talks to an owner's Google Calendar through a service account they shared
 * the calendar with. Signs the JWT itself, so no Google SDK is needed.
 */
class GoogleCalendarClient
{
    private const string TOKEN_URL = 'https://oauth2.googleapis.com/token';

    private const string SCOPE = 'https://www.googleapis.com/auth/calendar.events';

    /**
     * Create an event and return its Google event id.
     *
     * @param  array<string, mixed>  $event
     */
    public function create(Storefront $storefront, array $event): string
    {
        return (string) $this->request($storefront)
            ->post($this->eventsUrl((string) $storefront->google_calendar_id), $event)
            ->throw()
            ->json('id');
    }

    /**
     * Update an existing event in place.
     *
     * @param  array<string, mixed>  $event
     */
    public function update(Storefront $storefront, string $eventId, array $event): void
    {
        $this->request($storefront)
            ->patch($this->eventsUrl((string) $storefront->google_calendar_id).'/'.rawurlencode($eventId), $event)
            ->throw();
    }

    /**
     * Remove an event; one already gone on Google's side counts as done.
     */
    public function delete(Storefront $storefront, string $eventId): void
    {
        $response = $this->request($storefront)
            ->delete($this->eventsUrl((string) $storefront->google_calendar_id).'/'.rawurlencode($eventId));

        if (! in_array($response->status(), [404, 410], true)) {
            $response->throw();
        }
    }

    /**
     * Check credentials end to end (sign in, then read the calendar) without
     * saving anything. Throws when Google refuses.
     */
    public function verify(string $calendarId, string $clientEmail, string $privateKey): void
    {
        Http::withToken($this->mintToken($clientEmail, $privateKey))
            ->acceptJson()
            ->timeout(10)
            ->get($this->eventsUrl($calendarId), ['maxResults' => 1])
            ->throw();
    }

    /**
     * Forget a cached token, e.g. after the owner changes their credentials.
     */
    public function forgetToken(Storefront $storefront): void
    {
        Cache::forget($this->tokenCacheKey($storefront));
    }

    private function request(Storefront $storefront): PendingRequest
    {
        $token = Cache::remember(
            $this->tokenCacheKey($storefront),
            now()->addMinutes(55),
            fn (): string => $this->mintToken((string) $storefront->google_client_email, (string) $storefront->google_private_key),
        );

        return Http::withToken($token)->acceptJson()->timeout(10);
    }

    private function mintToken(string $clientEmail, string $privateKey): string
    {
        return (string) Http::asForm()->timeout(10)->post(self::TOKEN_URL, [
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion' => $this->assertion($clientEmail, $privateKey),
        ])->throw()->json('access_token');
    }

    /**
     * The service-account JWT, signed RS256.
     */
    private function assertion(string $clientEmail, string $privateKey): string
    {
        $now = time();
        $input = implode('.', [
            $this->base64Url((string) json_encode(['alg' => 'RS256', 'typ' => 'JWT'])),
            $this->base64Url((string) json_encode([
                'iss' => $clientEmail,
                'scope' => self::SCOPE,
                'aud' => self::TOKEN_URL,
                'iat' => $now,
                'exp' => $now + 3600,
            ])),
        ]);
        $signature = '';

        // Keys pasted on one line keep literal "\n" escapes.
        if (! openssl_sign($input, $signature, str_replace('\n', "\n", $privateKey), OPENSSL_ALGO_SHA256)) {
            throw new RuntimeException('That private key could not be used to sign in to Google.');
        }

        return $input.'.'.$this->base64Url($signature);
    }

    private function base64Url(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }

    private function eventsUrl(string $calendarId): string
    {
        return 'https://www.googleapis.com/calendar/v3/calendars/'.rawurlencode($calendarId).'/events';
    }

    private function tokenCacheKey(Storefront $storefront): string
    {
        return "google-calendar.token.{$storefront->id}";
    }
}
