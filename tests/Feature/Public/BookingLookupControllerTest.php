<?php

use App\Models\Booking;
use App\Models\Storefront;

test('a guest finds their booking by reference and email regardless of casing', function () {
    $booking = Booking::factory()->create(['renter_email' => 'juan@example.com']);

    $this->post(route('bookings.lookup.store'), [
        'reference' => strtolower($booking->reference),
        'email' => 'JUAN@example.com',
    ])->assertRedirect($booking->manageUrl());
});

test('a lookup with a mismatched email does not reveal the booking', function () {
    $booking = Booking::factory()->create(['renter_email' => 'juan@example.com']);

    $this->post(route('bookings.lookup.store'), [
        'reference' => $booking->reference,
        'email' => 'someone@example.com',
    ])->assertSessionHasErrors(['reference' => 'We could not find a booking with that reference and email.']);
});

test('the booking lookup is available inside an owner\'s branding', function () {
    $storefront = Storefront::factory()->create();

    $this->get(route('storefronts.bookings.lookup', $storefront))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('storefront/lookup')
            ->where('storefront.slug', $storefront->slug));
});
