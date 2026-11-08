<?php

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Car;
use App\Models\CarBlock;
use App\Models\Plan;
use App\Models\Storefront;
use App\Notifications\BookingActivity;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;

beforeEach(function () {
    Notification::fake();
    $this->storefront = Storefront::factory()->onPlan()->create(['name' => 'ABQ Car Rental']);
    $this->owner = $this->storefront->owner;
    $this->car = Car::factory()->for($this->owner, 'owner')->create(['make' => 'Toyota', 'model' => 'Vios', 'year' => 2024]);
});

test('a renter requests a car from the owner\'s booking page', function () {
    $start = today()->addDays(10)->toDateString();
    $end = today()->addDays(12)->toDateString();

    $page = visit(route('storefronts.cars.show', [$this->storefront, $this->car], absolute: false)."?start_date={$start}&end_date={$end}");

    $page->assertSee('Vios')
        ->click('Request to book')
        ->type('renter_name', 'Juan Dela Cruz')
        ->type('renter_email', 'juan@example.com')
        ->type('renter_phone', '09171234567')
        ->type('renter_license_number', 'N01-23-456789')
        ->click('#accepted_terms')
        ->press('Send booking request')
        ->assertSee('Juan Dela Cruz')
        ->assertNoJavaScriptErrors();

    expect(Booking::sole())
        ->renter_email->toBe('juan@example.com')
        ->status->toBe(BookingStatus::Pending);
});

test('an owner confirms a request from the bookings list', function () {
    $booking = Booking::factory()->for($this->car)->create(['renter_name' => 'Maria Santos']);
    $this->actingAs($this->owner);

    visit('/lessor/bookings')
        ->assertSee('Maria Santos')
        ->press('Confirm')
        ->assertSee('marked as confirmed')
        ->assertNoJavaScriptErrors();

    expect($booking->fresh()->status)->toBe(BookingStatus::Confirmed);
});

test('an owner blocks a car\'s dates, picking the car inside the dialog', function () {
    Car::factory()->for($this->owner, 'owner')->create(['make' => 'Honda', 'model' => 'City', 'year' => 2023]);
    $day = today()->addDays(3);
    $this->actingAs($this->owner);

    visit('/lessor/bookings/blocked')
        ->press('Block dates')
        ->click('Choose a car')
        ->click('2024 Toyota Vios')
        ->click("[role=\"dialog\"] button[data-day=\"{$day->format('n/j/Y')}\"]")
        ->click('[role="dialog"] button[type="submit"]')
        ->assertSee('Dates blocked')
        ->assertNoJavaScriptErrors();

    expect(CarBlock::sole())
        ->car_id->toBe($this->car->id)
        ->start_date->toDateString()->toBe($day->toDateString());
});

test('the home page switches plan prices to yearly billing', function () {
    Plan::query()->update(['is_active' => false]);
    Plan::factory()->create(['name' => 'Growth', 'price' => 149900, 'features' => ['sms']]);

    visit('/')
        ->assertSee('One flat price')
        ->click('button[role="radio"]:has-text("Yearly")')
        ->assertSee('₱14,990 billed yearly')
        ->assertNoJavaScriptErrors();
});

test('an owner opens a new alert from the notification bell', function () {
    $booking = Booking::factory()->for($this->car)->create(['renter_name' => 'Pedro Reyes']);
    $booking->recordEvent('requested');
    $this->owner->notifications()->create([
        'id' => (string) Str::uuid(),
        'type' => BookingActivity::class,
        'data' => (new BookingActivity($booking->events()->sole()))->toArray($this->owner),
    ]);
    $this->actingAs($this->owner);

    visit('/lessor/dashboard')
        ->click('button[aria-label^="Notifications"]')
        ->assertSee('New booking request')
        ->click('New booking request')
        ->assertSee('Pedro Reyes')
        ->assertNoJavaScriptErrors();

    expect($this->owner->unreadNotifications()->count())->toBe(0);
});
