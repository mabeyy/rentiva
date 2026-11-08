<?php

use App\Models\Booking;
use App\Models\Car;
use App\Models\User;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    config([
        'services.turnstile.site_key' => 'site-key',
        'services.turnstile.secret_key' => 'secret-key',
    ]);
    Notification::fake();
});

/**
 * A valid booking request, plus the Turnstile token when one is given.
 *
 * @return array<string, mixed>
 */
function bookingRequestWithToken(?string $token = null): array
{
    return array_filter([
        'start_date' => today()->addDays(3)->toDateString(),
        'end_date' => today()->addDays(6)->toDateString(),
        'renter_name' => 'Juan Dela Cruz',
        'renter_email' => 'juan@example.com',
        'renter_phone' => '09171234567',
        'renter_license_number' => 'N01-23-456789',
        'accepted_terms' => '1',
        'cf-turnstile-response' => $token,
    ], fn (?string $value): bool => $value !== null);
}

/**
 * Fake Cloudflare's answer to the token check.
 */
function cloudflareSays(bool $success): void
{
    Http::fake([
        'challenges.cloudflare.com/*' => Http::response(['success' => $success]),
    ]);
}

test('a booking request with a token Cloudflare accepts goes through', function () {
    cloudflareSays(true);
    $car = Car::factory()->create();

    $this->post(route('cars.bookings.store', $car), bookingRequestWithToken('good-token'))
        ->assertSessionHasNoErrors();

    expect(Booking::count())->toBe(1);
    Http::assertSent(fn (Request $request) => $request['secret'] === 'secret-key' && $request['response'] === 'good-token');
});

test('a booking request is rejected when the token is missing or Cloudflare rejects it', function (?string $token) {
    cloudflareSays(false);
    $car = Car::factory()->create();

    $this->post(route('cars.bookings.store', $car), bookingRequestWithToken($token))
        ->assertSessionHasErrors('cf-turnstile-response');

    expect(Booking::count())->toBe(0);
})->with([
    'missing' => [null],
    'rejected' => ['bot-token'],
]);

test('sign up is rejected when Cloudflare rejects the token', function () {
    cloudflareSays(false);

    $this->post(route('register.store'), [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'business_name' => 'ABQ Car Rental',
        'password' => 'password',
        'password_confirmation' => 'password',
        'cf-turnstile-response' => 'bot-token',
    ])->assertSessionHasErrors('cf-turnstile-response');

    expect(User::where('email', 'test@example.com')->exists())->toBeFalse();
});

test('forms skip the check and pages get no site key until both keys are set', function () {
    config(['services.turnstile.secret_key' => null]);
    Http::fake();
    $car = Car::factory()->create();

    $this->post(route('cars.bookings.store', $car), bookingRequestWithToken())->assertSessionHasNoErrors();

    $this->get(route('register'))->assertInertia(fn (Assert $page) => $page->where('turnstileSiteKey', null));
    Http::assertNotSent(fn (Request $request) => str_contains($request->url(), 'challenges.cloudflare.com'));
});
