<?php

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Models\Booking;
use App\Models\Car;
use App\Models\CarBlock;
use App\Models\PaymentAccount;
use App\Models\Review;
use App\Models\Storefront;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

/** Every page in the owner's sidebar and settings, with the Inertia page it renders. */
dataset('owner pages', [
    'dashboard' => ['lessor.dashboard', 'lessor/dashboard'],
    'revenue' => ['lessor.revenue.index', 'lessor/revenue'],
    'activity' => ['lessor.activity', 'lessor/activity'],
    'bookings calendar' => ['lessor.bookings.calendar', 'lessor/bookings/calendar'],
    'bookings list' => ['lessor.bookings.index', 'lessor/bookings/index'],
    'blocked dates' => ['lessor.bookings.blocked', 'lessor/bookings/blocked'],
    'transfers' => ['lessor.transfers', 'lessor/transfers'],
    'add booking' => ['lessor.bookings.create', 'lessor/bookings/create'],
    'renters' => ['lessor.renters.index', 'lessor/renters/index'],
    'reviews' => ['lessor.reviews.index', 'lessor/reviews'],
    'peak seasons' => ['lessor.seasons.index', 'lessor/seasons'],
    'team' => ['lessor.team.index', 'lessor/team'],
    'billing' => ['lessor.billing.index', 'lessor/billing'],
    'my cars' => ['lessor.cars.index', 'lessor/cars/index'],
    'new car' => ['lessor.cars.create', 'lessor/cars/create'],
    'booking page' => ['lessor.storefront.edit', 'lessor/storefront'],
    'pickup locations' => ['lessor.pickup-locations.index', 'lessor/pickup-locations'],
    'payments' => ['lessor.payments.edit', 'lessor/payments'],
    'policies' => ['lessor.policies.edit', 'lessor/policies'],
    'email' => ['lessor.connections.email', 'lessor/connections/email'],
    'sms' => ['lessor.connections.sms', 'lessor/connections/sms'],
    'calendar sync' => ['lessor.connections.calendar', 'lessor/connections/calendar'],
    'deliveries' => ['lessor.connections.deliveries', 'lessor/connections/deliveries'],
    'profile' => ['profile.edit', 'settings/profile'],
]);

test('every owner page opens for a fully set-up owner', function (string $route, string $component) {
    $storefront = Storefront::factory()->create(['accepts_bank_transfer' => true]);
    PaymentAccount::factory()->for($storefront)->create();
    $car = Car::factory()->for($storefront->owner, 'owner')->create();
    Booking::factory()->for($car)->create();
    Booking::factory()->for($car)->confirmed()->create(['payment_method' => PaymentMethod::BankTransfer, 'payment_status' => PaymentStatus::Submitted]);
    $completed = Booking::factory()->for($car)->completed()->create(['start_date' => now()->subDays(10), 'end_date' => now()->subDays(7)]);
    Review::factory()->for($completed)->create();
    CarBlock::factory()->for($car)->create();

    $this->actingAs($storefront->owner)
        ->get(route($route))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component($component));
})->with('owner pages');

test('every owner page opens for a brand-new owner with nothing set up', function (string $route, string $component) {
    $this->actingAs(User::factory()->create())
        ->get(route($route))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component($component));
})->with('owner pages');

test('a car\'s edit page opens', function () {
    $car = Car::factory()->create();

    $this->actingAs($car->owner)
        ->get(route('lessor.cars.edit', $car))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('lessor/cars/edit'));
});
