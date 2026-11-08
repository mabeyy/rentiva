<?php

use App\Models\Booking;
use App\Models\Car;
use App\Models\Plan;
use App\Models\Storefront;
use Illuminate\Support\Facades\Notification;

beforeEach(function () {
    Notification::fake();
    $this->storefront = Storefront::factory()->onPlan()->create(['name' => 'ABQ Car Rental']);
    $this->car = Car::factory()->for($this->storefront->owner, 'owner')->create(['make' => 'Toyota', 'model' => 'Vios', 'year' => 2024]);
    Car::factory()->count(2)->for($this->storefront->owner, 'owner')->create();
    Plan::factory()->create(['name' => 'Growth', 'price' => 149900, 'features' => ['sms']]);
});

/**
 * Whether the page is wider than the screen, so renters would have to scroll
 * sideways.
 */
const OVERFLOW_CHECK = 'document.documentElement.scrollWidth > window.innerWidth';

test('renter pages fit a phone screen without sideways scrolling', function (string $page) {
    $url = match ($page) {
        'home' => route('home', absolute: false),
        'directory' => route('rent', absolute: false),
        'booking page' => route('storefronts.show', $this->storefront, absolute: false),
        'car page' => route('storefronts.cars.show', [$this->storefront, $this->car], absolute: false),
        'find my booking' => route('storefronts.bookings.lookup', $this->storefront, absolute: false),
        'manage booking' => str(Booking::factory()->for($this->car)->create()->manageUrl())->after(config('app.url'))->toString(),
        'terms' => route('terms', absolute: false),
    };

    $browser = visit($url)->on()->mobile();

    expect($browser->script(OVERFLOW_CHECK))->toBeFalse();
    $browser->assertNoJavaScriptErrors();
})->with(['home', 'directory', 'booking page', 'car page', 'find my booking', 'manage booking', 'terms']);

test('the booking form fits a phone screen', function () {
    $start = today()->addDays(10)->toDateString();
    $end = today()->addDays(12)->toDateString();

    $browser = visit(route('storefronts.cars.show', [$this->storefront, $this->car], absolute: false)."?start_date={$start}&end_date={$end}")
        ->on()->mobile()
        ->click('Request to book')
        ->assertSee('Send booking request');

    expect($browser->script(OVERFLOW_CHECK))->toBeFalse();
    $browser->assertNoJavaScriptErrors();
});

test('on a phone, the bar at the bottom of a car page opens the calendar', function () {
    visit(route('storefronts.cars.show', [$this->storefront, $this->car], absolute: false))
        ->on()->mobile()
        ->click('.fixed.bottom-0 button')
        ->assertVisible('[data-slot="popover-content"]')
        ->assertNoJavaScriptErrors();
});
