<?php

use App\Enums\BookingSource;
use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Models\Booking;
use App\Models\Car;
use App\Models\Storefront;
use App\Notifications\BookingRequested;
use App\Notifications\BookingStatusChanged;
use Illuminate\Http\UploadedFile;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;

/**
 * @return array<string, mixed>
 */
function manualBooking(Car $car, array $overrides = []): array
{
    return [
        'car' => $car->slug,
        'start_date' => today()->addDays(2)->toDateString(),
        'end_date' => today()->addDays(4)->toDateString(),
        'renter_name' => 'Maria Santos',
        'renter_phone' => '09181234567',
        'renter_license_number' => 'N01-23-456789',
        'license_photo' => UploadedFile::fake()->image('license.jpg'),
        'source' => BookingSource::Phone->value,
        'payment_method' => 'pickup',
        ...$overrides,
    ];
}

beforeEach(function () {
    Notification::fake();
    Storage::fake('local');
    $this->storefront = Storefront::factory()->onPlan()->create();
    $this->car = Car::factory()->for($this->storefront->owner, 'owner')->create(['daily_rate' => 200000]);
});

test('an owner adds a phone booking: confirmed, priced, and logged', function () {
    $this->actingAs($this->storefront->owner)
        ->post(route('lessor.bookings.store'), manualBooking($this->car, ['is_paid' => '1']))
        ->assertSessionHasNoErrors();

    $booking = Booking::sole();
    expect($booking)
        ->status->toBe(BookingStatus::Confirmed)
        ->source->toBe(BookingSource::Phone)
        ->renter_email->toBeNull()
        ->total->toBe(400000)
        ->payment_status->toBe(PaymentStatus::Paid)
        ->and($booking->events()->sole()->action)->toBe('added');
    Notification::assertNotSentTo($this->storefront->owner, BookingRequested::class);
    Notification::assertNothingSentTo(new AnonymousNotifiable);
});

test('the renter\'s license number and photo are required', function () {
    $this->actingAs($this->storefront->owner)
        ->post(route('lessor.bookings.store'), manualBooking($this->car, ['renter_license_number' => '', 'license_photo' => null]))
        ->assertSessionHasErrors(['renter_license_number', 'license_photo']);

    expect(Booking::count())->toBe(0);
});

test('the license photo is stored privately with the booking', function () {
    $this->actingAs($this->storefront->owner)
        ->post(route('lessor.bookings.store'), manualBooking($this->car))
        ->assertSessionHasNoErrors();

    Storage::disk('local')->assertExists(Booking::sole()->license_photo_path);
});

test('a renter email gets the confirmation', function () {
    $this->actingAs($this->storefront->owner)
        ->post(route('lessor.bookings.store'), manualBooking($this->car, ['renter_email' => 'maria@example.com']));

    Notification::assertSentOnDemand(BookingStatusChanged::class);
});

test('manual bookings can\'t clash with other bookings or use someone else\'s car', function () {
    Booking::factory()->for($this->car)->confirmed()->between(today()->addDays(3)->toDateString(), today()->addDays(6)->toDateString())->create();
    $this->actingAs($this->storefront->owner);

    $this->post(route('lessor.bookings.store'), manualBooking($this->car))
        ->assertSessionHasErrors(['start_date' => 'This car is already booked for some of those dates.']);
    $this->post(route('lessor.bookings.store'), manualBooking(Car::factory()->create()))
        ->assertSessionHasErrors(['car' => 'Choose one of your cars.']);

    expect(Booking::count())->toBe(1);
});

test('the bookings pages load the add-booking form only when the modal asks for it', function (string $route) {
    $this->actingAs($this->storefront->owner)
        ->get(route($route))
        ->assertInertia(fn ($page) => $page
            ->missing('bookingForm')
            ->reloadOnly('bookingForm', fn ($reload) => $reload
                ->where('bookingForm.cars.0.slug', $this->car->slug)
                ->where('bookingForm.hasStorefront', true)
                ->has('bookingForm.sources')
                ->has('bookingForm.paymentMethods')));
})->with(['lessor.bookings.index', 'lessor.bookings.calendar', 'lessor.bookings.blocked']);
