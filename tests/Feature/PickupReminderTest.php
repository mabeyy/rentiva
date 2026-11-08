<?php

use App\Actions\Integrations\SendSms;
use App\Models\Booking;
use App\Models\Car;
use App\Models\Storefront;
use App\Notifications\PickupReminder;
use Carbon\CarbonImmutable;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;

/**
 * A confirmed booking picked up on Nov 10, 2026 at the owner's pickup time.
 *
 * @param  array<string, mixed>  $storefrontAttributes
 */
function bookingPickedUpNov10(array $storefrontAttributes = []): Booking
{
    $storefront = Storefront::factory()->onPlan()->create([
        'pickup_time' => '09:00',
        'semaphore_api_key' => 'sem-key',
        'sms_enabled' => true,
        ...$storefrontAttributes,
    ]);

    return Booking::factory()
        ->for(Car::factory()->for($storefront->owner, 'owner'))
        ->between('2026-11-10', '2026-11-12')
        ->confirmed()
        ->create(['renter_phone' => '09171234567']);
}

/** Travel to a Philippine wall-clock time. */
function travelToManila(string $time): void
{
    test()->travelTo(CarbonImmutable::parse($time, Booking::PICKUP_TIMEZONE));
}

beforeEach(function () {
    Notification::fake();
    Http::fake([SendSms::ENDPOINT => Http::response([['message_id' => 1]])]);
});

test('renters get the 24-hour reminder by email and text, once', function () {
    $booking = bookingPickedUpNov10();
    travelToManila('2026-11-09 10:00');

    $this->artisan('bookings:send-reminders')->assertSuccessful();
    $this->artisan('bookings:send-reminders')->assertSuccessful();

    Notification::assertSentTimes(PickupReminder::class, 1);
    Notification::assertSentTo(new AnonymousNotifiable, PickupReminder::class, fn (PickupReminder $notification) => $notification->hoursBefore === 24);
    Http::assertSentCount(1);
    Http::assertSent(fn ($request) => str_contains($request['message'], 'tomorrow at 9:00 AM'));
    expect($booking->fresh())
        ->reminder_24h_sent_at->not->toBeNull()
        ->reminder_2h_sent_at->toBeNull();
});

test('the reminder email names the car, pickup time and booking', function () {
    $booking = bookingPickedUpNov10();
    travelToManila('2026-11-09 10:00');

    $message = (new PickupReminder($booking, 24))->toMail(new AnonymousNotifiable);
    $rendered = (string) $message->render();

    expect($message->subject)->toContain($booking->car->name)
        ->and($rendered)->toContain($booking->reference)
        ->and($rendered)->toContain('9:00 AM');
});

test('nothing goes out more than 24 hours before pickup', function () {
    bookingPickedUpNov10();
    travelToManila('2026-11-09 08:30');

    $this->artisan('bookings:send-reminders')->assertSuccessful();

    Notification::assertNothingSent();
    Http::assertNothingSent();
});

test('the 2-hour reminder follows the owner\'s pickup time', function () {
    $booking = bookingPickedUpNov10(['pickup_time' => '14:00']);
    travelToManila('2026-11-10 12:30');

    $this->artisan('bookings:send-reminders')->assertSuccessful();

    Notification::assertSentTo(new AnonymousNotifiable, PickupReminder::class, fn (PickupReminder $notification) => $notification->hoursBefore === 2);
    Http::assertSent(fn ($request) => str_contains($request['message'], 'in 2 hours at 2:00 PM'));
    expect($booking->fresh())->reminder_2h_sent_at->not->toBeNull()->reminder_24h_sent_at->not->toBeNull();
});

test('switched-off reminders are not sent', function () {
    $booking = bookingPickedUpNov10(['remind_email_24h' => false, 'remind_sms_24h' => false]);
    travelToManila('2026-11-09 10:00');

    $this->artisan('bookings:send-reminders')->assertSuccessful();

    Notification::assertNothingSent();
    Http::assertNothingSent();

    travelToManila('2026-11-10 07:30');
    $this->artisan('bookings:send-reminders')->assertSuccessful();

    Notification::assertSentTimes(PickupReminder::class, 1);
    Http::assertSentCount(1);
});

test('pending bookings get no reminders', function () {
    bookingPickedUpNov10()->update(['status' => 'pending']);
    travelToManila('2026-11-09 10:00');

    $this->artisan('bookings:send-reminders')->assertSuccessful();

    Notification::assertNothingSent();
});

test('owners switch each reminder on or off from the email and SMS pages', function () {
    $storefront = Storefront::factory()->create();

    $this->actingAs($storefront->owner)
        ->put(route('lessor.connections.reminders.update'), ['remind_sms_2h' => false])
        ->assertSessionHasNoErrors();

    expect($storefront->fresh())->remind_sms_2h->toBeFalse()->remind_sms_24h->toBeTrue();

    $this->get(route('lessor.connections.sms'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('settings.reminders.remind_24h', true)
            ->where('settings.reminders.remind_2h', false)
            ->where('settings.reminders.pickup_time', '09:00'));
});

test('owners set their usual pickup time on the policies page', function () {
    $storefront = Storefront::factory()->create();

    $this->actingAs($storefront->owner)->put(route('lessor.policies.update'), [
        'renter_cancellation' => 'anytime',
        'pickup_time' => '25:00',
    ])->assertSessionHasErrors('pickup_time');

    $this->put(route('lessor.policies.update'), [
        'renter_cancellation' => 'anytime',
        'pickup_time' => '08:30',
    ])->assertSessionHasNoErrors();

    expect($storefront->fresh()->pickup_time)->toBe('08:30');
});
