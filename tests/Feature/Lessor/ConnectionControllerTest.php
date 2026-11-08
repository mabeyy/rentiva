<?php

use App\Actions\Integrations\SendSms;
use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Car;
use App\Models\NotificationLog;
use App\Models\Storefront;
use App\Models\User;
use App\Notifications\BookingStatusChanged;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia as Assert;

/**
 * A throwaway RSA key in PEM form, so the service-account JWT can be signed.
 */
function testPrivateKey(): string
{
    openssl_pkey_export(openssl_pkey_new(['private_key_bits' => 2048]), $pem);

    return $pem;
}

describe('settings', function () {
    test('an owner connects their own email; the key is encrypted and never sent to the browser', function () {
        $storefront = Storefront::factory()->create();

        $this->actingAs(User::factory()->admin()->create())->put(route('admin.lessors.connections.email.update', $storefront->owner), [
            'resend_api_key' => 're_secret123',
            'mail_from_address' => 'bookings@abq.ph',
        ])->assertSessionHasNoErrors();

        $storefront->refresh();
        expect($storefront->resend_api_key)->toBe('re_secret123')
            ->and(DB::table('storefronts')->where('id', $storefront->id)->value('resend_api_key'))->not->toContain('re_secret123');

        $this->get(route('admin.lessors.connections.email', $storefront->owner))
            ->assertInertia(fn (Assert $page) => $page
                ->where('settings.has_api_key', true)
                ->where('settings.mail_from_address', 'bookings@abq.ph')
                ->missing('settings.resend_api_key'));
    });

    test('leaving a key blank keeps the saved one', function () {
        $storefront = Storefront::factory()->create(['semaphore_api_key' => 'saved-key']);

        $this->actingAs(User::factory()->admin()->create())->put(route('admin.lessors.connections.sms.update', $storefront->owner), [
            'semaphore_api_key' => '',
            'sms_sender_name' => 'ABQRENTAL',
            'sms_enabled' => '1',
        ])->assertSessionHasNoErrors();

        expect($storefront->fresh())
            ->semaphore_api_key->toBe('saved-key')
            ->sms_enabled->toBeTrue();
    });

    test('an admin can set up an owner\'s connections for them', function () {
        $storefront = Storefront::factory()->create();

        $this->actingAs(User::factory()->admin()->create())
            ->put(route('admin.lessors.connections.sms.update', $storefront->owner), [
                'semaphore_api_key' => 'admin-set-key',
                'sms_enabled' => '1',
            ])
            ->assertSessionHasNoErrors();

        expect($storefront->fresh()->semaphore_api_key)->toBe('admin-set-key');
    });

    test('owners cannot reach another owner\'s connections', function () {
        $storefront = Storefront::factory()->create();

        $this->actingAs(Storefront::factory()->create()->owner)
            ->get(route('admin.lessors.connections.email', $storefront->owner))
            ->assertForbidden();
    });

    test('a test email goes through the owner\'s mailer', function () {
        Mail::fake();
        $storefront = Storefront::factory()->create();

        $this->actingAs(User::factory()->admin()->create())->post(route('admin.lessors.connections.email.test', $storefront->owner), [
            'resend_api_key' => 're_try',
            'mail_from_address' => 'bookings@abq.ph',
            'test_recipient' => 'owner@abq.ph',
        ])->assertSessionHasNoErrors();

        expect(NotificationLog::sole())->channel->toBe('mail')->status->toBe('sent');
    });
});

describe('sending', function () {
    test('renter emails use the owner\'s own mailer once connected', function () {
        $storefront = Storefront::factory()->onPlan()->create(['resend_api_key' => 're_x', 'mail_from_address' => 'bookings@abq.ph']);
        $booking = Booking::factory()->for(Car::factory()->for($storefront->owner, 'owner'))->confirmed()->create();

        $message = (new BookingStatusChanged($booking))->toMail($booking);

        expect($message->mailer)->toBe("owner_{$storefront->id}")
            ->and($message->from)->toBe(['bookings@abq.ph', $storefront->name]);
    });

    test('confirming a booking texts the renter through the owner\'s Semaphore account', function () {
        Http::fake([SendSms::ENDPOINT => Http::response([['message_id' => 1]])]);
        $storefront = Storefront::factory()->onPlan()->create(['semaphore_api_key' => 'sem-key', 'sms_enabled' => true]);
        $booking = Booking::factory()->for(Car::factory()->for($storefront->owner, 'owner'))->create(['renter_phone' => '09171234567']);

        $this->actingAs($storefront->owner)
            ->patch(route('lessor.bookings.update', $booking), ['status' => BookingStatus::Confirmed->value]);

        Http::assertSent(fn ($request) => $request['apikey'] === 'sem-key'
            && $request['number'] === '09171234567'
            && str_contains($request['message'], 'is confirmed'));
        expect(NotificationLog::where('channel', 'sms')->sole())->status->toBe('sent');
    });

    test('no texts are sent while SMS is switched off', function () {
        Http::fake();
        $storefront = Storefront::factory()->create(['semaphore_api_key' => 'sem-key', 'sms_enabled' => false]);
        $booking = Booking::factory()->for(Car::factory()->for($storefront->owner, 'owner'))->create();

        $this->actingAs($storefront->owner)
            ->patch(route('lessor.bookings.update', $booking), ['status' => BookingStatus::Confirmed->value]);

        Http::assertNothingSent();
    });

    test('confirmed bookings appear on the owner\'s Google Calendar and leave it when cancelled', function () {
        Http::fake([
            'oauth2.googleapis.com/*' => Http::response(['access_token' => 'token']),
            'www.googleapis.com/calendar/*' => Http::sequence()
                ->push(['id' => 'evt_123'])
                ->push([], 204),
        ]);
        $storefront = Storefront::factory()->onPlan()->create([
            'google_calendar_enabled' => true,
            'google_calendar_id' => 'abq@group.calendar.google.com',
            'google_client_email' => 'sync@abq.iam.gserviceaccount.com',
            'google_private_key' => testPrivateKey(),
        ]);
        $booking = Booking::factory()->for(Car::factory()->for($storefront->owner, 'owner'))->create();

        $this->actingAs($storefront->owner)
            ->patch(route('lessor.bookings.update', $booking), ['status' => BookingStatus::Confirmed->value]);
        expect($booking->fresh()->google_event_id)->toBe('evt_123');

        $this->patch(route('lessor.bookings.update', $booking), ['status' => BookingStatus::Cancelled->value]);
        expect($booking->fresh()->google_event_id)->toBeNull();
        Http::assertSent(fn ($request) => $request->method() === 'DELETE' && str_ends_with($request->url(), '/events/evt_123'));
    });
});

test('the deliveries page lists the owner\'s own emails and texts', function () {
    $storefront = Storefront::factory()->create();
    NotificationLog::record(null, 'sms', '09171234567', 'Your booking is confirmed', true, storefront: $storefront);
    NotificationLog::record(null, 'sms', '09170000000', 'Someone else', true, storefront: Storefront::factory()->create());

    $this->actingAs($storefront->owner)
        ->get(route('lessor.connections.deliveries'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('lessor/connections/deliveries')
            ->has('deliveries.data', 1)
            ->where('deliveries.data.0.summary', 'Your booking is confirmed'));
});

describe('managed by Rentiva', function () {
    test('owners see their email and SMS status but can\'t change them', function () {
        $storefront = Storefront::factory()->create();
        $this->actingAs($storefront->owner);

        $this->get(route('lessor.connections.email'))
            ->assertInertia(fn (Assert $page) => $page->where('canEdit', false)->where('urls.update', null));
        $this->get(route('lessor.connections.sms'))
            ->assertInertia(fn (Assert $page) => $page->where('canEdit', false));
        $this->put('/lessor/connections/sms', ['semaphore_api_key' => 'mine'])->assertMethodNotAllowed();
    });

    test('owners set up calendar sync only when their plan includes it', function () {
        $basic = Storefront::factory()->onPlan(['features' => ['sms']])->create();
        $this->actingAs($basic->owner)->get(route('lessor.connections.calendar'))
            ->assertInertia(fn (Assert $page) => $page->where('canEdit', false)->where('plan.calendar_sync', false));
        $this->put(route('lessor.connections.calendar.update'), ['google_calendar_id' => 'x'])->assertForbidden();

        $full = Storefront::factory()->onPlan()->create();
        $this->actingAs($full->owner)->get(route('lessor.connections.calendar'))
            ->assertInertia(fn (Assert $page) => $page->where('canEdit', true));
    });

    test('texts and own-address email only go out on plans that include them', function () {
        Http::fake();
        $storefront = Storefront::factory()->onPlan(['features' => ['email', 'calendar_sync']])
            ->create(['semaphore_api_key' => 'sem-key', 'sms_enabled' => true, 'resend_api_key' => 're_x', 'mail_from_address' => 'bookings@abq.ph']);
        $booking = Booking::factory()->for(Car::factory()->for($storefront->owner, 'owner'))->create();

        $this->actingAs($storefront->owner)->patch(route('lessor.bookings.update', $booking), ['status' => BookingStatus::Confirmed->value]);

        Http::assertNothingSent();
        expect((new BookingStatusChanged($booking->fresh()))->toMail($booking)->mailer)->toBeNull();
    });
});
