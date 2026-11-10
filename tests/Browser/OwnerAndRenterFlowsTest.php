<?php

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Car;
use App\Models\CarBlock;
use App\Models\PaymentAccount;
use App\Models\Plan;
use App\Models\Review;
use App\Models\Storefront;
use App\Models\TeamMember;
use App\Notifications\BookingActivity;
use Illuminate\Http\UploadedFile;
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
        ->assertSee('Waiting for the owner to confirm')
        ->assertSee('Your host')
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

test('the directory counts a featured business and shows no empty state', function () {
    $this->owner->subscription->plan->update(['features' => ['featured_listing']]);

    visit(route('rent', absolute: false))
        ->assertSee('1 rental company')
        ->assertDontSee('No rental companies found')
        ->assertNoJavaScriptErrors();
});

test('pricing in the header scrolls down the home page instead of reloading it', function () {
    $page = visit('/')->resize(1280, 800);

    $page->click('header nav a:has-text("Pricing")')->wait(1);

    expect($page->script('window.scrollY'))->toBeGreaterThan(500)
        ->and($page->script('window.location.hash'))->toBe('#pricing');
    $page->assertNoJavaScriptErrors();
});

test('the directory filters as the renter types, without pressing Enter', function () {
    $other = Storefront::factory()->create(['name' => 'Zamboanga Wheels']);
    Car::factory()->for($other->owner, 'owner')->create();

    visit(route('rent', absolute: false))
        ->assertSee('ABQ Car Rental')
        ->type('input[type="search"]', 'Zambo')
        ->wait(1)
        ->assertSee('Zamboanga Wheels')
        ->assertDontSee('ABQ Car Rental')
        ->assertNoJavaScriptErrors();
});

test('an owner adds a phone booking from the modal on the calendar', function () {
    $licensePhoto = UploadedFile::fake()->image('license.jpg');
    $this->actingAs($this->owner);

    visit('/lessor/bookings/calendar')
        ->press('Add booking')
        ->assertSee('Add a booking')
        ->type('renter_name', 'Ana Reyes')
        ->type('renter_phone', '09171234567')
        ->type('renter_license_number', 'N01-23-456789')
        ->attach('license_photo', $licensePhoto->getRealPath())
        ->click('[role="dialog"] #dates')
        ->click('[data-slot="popover-content"] button[data-day="'.today()->addDays(3)->format('n/j/Y').'"]')
        ->click('[data-slot="popover-content"] button[data-day="'.today()->addDays(5)->format('n/j/Y').'"]')
        ->click('[role="dialog"] button[type="submit"]')
        ->assertSee('Ana Reyes')
        ->assertNoJavaScriptErrors();

    expect(Booking::sole())
        ->renter_name->toBe('Ana Reyes')
        ->status->toBe(BookingStatus::Confirmed);
});

test('tapping the info icon on a dashboard number explains it without leaving the page', function () {
    $this->actingAs($this->owner);

    visit('/lessor/dashboard')
        ->click('a:has-text("Requests to review") button[aria-label="What does this mean?"]')
        ->assertSee("haven't confirmed or declined yet")
        ->assertPathIs('/lessor/dashboard')
        ->assertNoJavaScriptErrors();
});

test('the car page section menu glides to the section it names', function () {
    $this->actingAs($this->owner);

    $page = visit("/lessor/cars/{$this->car->slug}/edit")->resize(1440, 900);
    $page->click('nav[aria-label="Sections"] a:has-text("Papers")')->wait(1.2);

    expect($page->script('window.scrollY'))->toBeGreaterThan(800)
        ->and($page->script('window.location.hash'))->toBe('#car-papers');
    $page->assertNoJavaScriptErrors();
});

test('a new logo shows as soon as it is picked, before saving', function () {
    $logo = UploadedFile::fake()->image('logo.png', 200, 200);
    $this->actingAs($this->owner);

    visit('/lessor/storefront')
        ->attach('logo', $logo->getRealPath())
        ->assertVisible('img[alt="New logo preview"]')
        ->assertSee('New logo, not saved yet.')
        ->assertSee(basename($logo->getRealPath()))
        ->assertNoJavaScriptErrors();
});

test('a saved transfer account shows as a summary, opens to edit, and folds back after saving', function () {
    $account = PaymentAccount::factory()->for($this->storefront)->create([
        'bank_name' => 'GCash',
        'account_name' => 'ABQ Car Rental',
        'account_number' => '0917 123 4567',
        'qr_path' => 'payment-qr/gcash.png',
    ]);
    $this->storefront->update(['accepts_bank_transfer' => true]);
    $this->actingAs($this->owner);

    visit('/lessor/payments')
        ->assertSee('•••• 4567')
        ->click('button:has-text("Edit")')
        ->clear("#account-saved-{$account->id}-name")
        ->type("#account-saved-{$account->id}-name", 'ABQ Rentals Cebu')
        ->click('How renters see it')
        ->assertSee('What renters see on their booking page')
        ->press('Save payment settings')
        ->assertSee('ABQ Rentals Cebu · •••• 4567')
        ->assertNoJavaScriptErrors();

    expect($this->storefront->paymentAccounts()->sole())
        ->id->toBe($account->id)
        ->account_name->toBe('ABQ Rentals Cebu');
});

test('a transfer account without a QR code stays open with the upload required', function () {
    $account = PaymentAccount::factory()->for($this->storefront)->create(['qr_path' => null]);
    $this->storefront->update(['accepts_bank_transfer' => true]);
    $this->actingAs($this->owner);

    visit('/lessor/payments')
        ->assertPresent("#account-saved-{$account->id}-qr[required]")
        ->assertDontSee('Done')
        ->assertNoJavaScriptErrors();
});

test('an icon-only button names itself in a tooltip on hover', function () {
    TeamMember::factory()->create(['owner_id' => $this->owner->id]);
    $this->actingAs($this->owner);

    visit('/lessor/team')
        ->hover('button[aria-label^="Resend invite"]')
        ->assertSeeIn('[data-slot="tooltip-content"]', 'Resend invite')
        ->assertNoJavaScriptErrors();
});

test('a QR code enlarges in a pop-up on the same page', function () {
    PaymentAccount::factory()->for($this->storefront)->create(['qr_path' => 'payment-qr/gcash.png']);
    $this->storefront->update(['accepts_bank_transfer' => true]);
    $this->actingAs($this->owner);

    visit('/lessor/payments')
        ->click('button[aria-label="Enlarge QR code"] >> nth=0')
        ->assertVisible('[role="dialog"] img')
        ->assertPathIs('/lessor/payments')
        ->assertNoJavaScriptErrors();
});

test('the reviews page opens cleanly with a review left seconds ago', function () {
    Review::factory()->for(Booking::factory()->for($this->car)->completed())->create(['comment' => 'Great car.']);
    $this->actingAs($this->owner);

    visit('/lessor/reviews')
        ->assertSee('Great car.')
        ->assertNoJavaScriptErrors();
});

test('a confirmed bank-transfer booking asks the renter to send their payment, not to pay at pickup', function () {
    $this->storefront->update(['accepts_bank_transfer' => true]);
    PaymentAccount::factory()->for($this->storefront)->create();
    $booking = Booking::factory()->for($this->car)->confirmed()->create(['payment_method' => 'bank_transfer', 'payment_due_at' => now()->addHour()]);
    $url = parse_url($booking->manageUrl());

    visit($url['path'].'?'.$url['query'])
        ->resize(390, 844)
        ->assertSee('Send your payment below to keep these dates')
        ->assertDontSee('Payment is made at pickup')
        ->assertNoJavaScriptErrors();
});
