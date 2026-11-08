<?php

use App\Actions\Bookings\PriceBooking;
use App\Models\Booking;
use App\Models\Car;
use App\Models\CarImage;
use App\Models\Storefront;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;

/**
 * A renter's booking request for a car, days from today.
 *
 * @return array<string, mixed>
 */
function pricedRequest(int $startInDays, int $days, array $overrides = []): array
{
    return [
        'start_date' => today()->addDays($startInDays)->toDateString(),
        'end_date' => today()->addDays($startInDays + $days)->toDateString(),
        'renter_name' => 'Juan Dela Cruz',
        'renter_email' => 'juan@example.com',
        'renter_phone' => '09171234567',
        'renter_license_number' => 'N01-23-456789',
        'accepted_terms' => '1',
        ...$overrides,
    ];
}

describe('pricing', function () {
    test('long rentals get the weekly, then the monthly discount', function (int $days, int $expectedDiscount) {
        $car = Car::factory()->make(['daily_rate' => 100000, 'weekly_discount' => 10, 'monthly_discount' => 25]);

        $price = app(PriceBooking::class)->handle($car, today(), today()->addDays($days));

        expect($price['discount'])->toBe($expectedDiscount)
            ->and($price['total'])->toBe(100000 * $days - $expectedDiscount);
    })->with([
        'six days, no discount' => [6, 0],
        'a week, 10% off' => [7, 70000],
        'four weeks, 25% off' => [28, 700000],
    ]);

    test('delivery and a driver are added only when offered and chosen; the deposit stays separate', function () {
        $car = Car::factory()->make(['daily_rate' => 200000, 'delivery_fee' => 50000, 'driver_daily_rate' => 150000, 'security_deposit' => 500000]);
        $noExtras = Car::factory()->make(['daily_rate' => 200000, 'delivery_fee' => null, 'driver_daily_rate' => null]);

        $price = app(PriceBooking::class)->handle($car, today(), today()->addDays(2), withDelivery: true, withDriver: true);
        $unoffered = app(PriceBooking::class)->handle($noExtras, today(), today()->addDays(2), withDelivery: true, withDriver: true);

        expect($price)->toMatchArray(['subtotal' => 400000, 'delivery_fee' => 50000, 'driver_fee' => 300000, 'total' => 750000, 'security_deposit' => 500000])
            ->and($unoffered['total'])->toBe(400000);
    });

    test('an owner sets the deposit, discounts and extras on a car, in pesos', function () {
        $car = Car::factory()->create(['body_type' => 'sedan', 'seats' => 5, 'doors' => 4, 'drivetrain' => 'fwd']);
        CarImage::factory()->for($car)->create();

        $this->actingAs($car->owner)->put(route('lessor.cars.update', $car), [
            ...$car->only(['make', 'model', 'year', 'body_type', 'transmission', 'fuel_type', 'drivetrain', 'seats', 'doors', 'luggage_capacity', 'exterior_color', 'pickup_location_id']),
            'body_type' => $car->body_type->value,
            'transmission' => $car->transmission->value,
            'fuel_type' => $car->fuel_type->value,
            'drivetrain' => $car->drivetrain?->value,
            'daily_rate' => 2500,
            'security_deposit' => 5000,
            'weekly_discount' => 10,
            'monthly_discount' => '',
            'delivery_fee' => 0,
            'driver_daily_rate' => '',
        ])->assertSessionHasNoErrors();

        expect($car->fresh())
            ->security_deposit->toBe(500000)
            ->weekly_discount->toBe(10)
            ->monthly_discount->toBe(0)
            ->delivery_fee->toBe(0)
            ->driver_daily_rate->toBeNull();
    });
});

describe('booking with extras', function () {
    test('a renter books with delivery and a driver and the breakdown is saved', function () {
        Notification::fake();
        $car = Car::factory()->create(['daily_rate' => 200000, 'delivery_fee' => 50000, 'driver_daily_rate' => 100000, 'security_deposit' => 300000]);

        $this->post(route('cars.bookings.store', $car), pricedRequest(3, 2, [
            'with_delivery' => '1',
            'delivery_address' => 'Waterfront Hotel, Lahug',
            'with_driver' => '1',
        ]))->assertSessionHasNoErrors();

        expect(Booking::sole())
            ->subtotal->toBe(400000)
            ->delivery_fee->toBe(50000)
            ->driver_fee->toBe(200000)
            ->total->toBe(650000)
            ->security_deposit->toBe(300000)
            ->with_driver->toBeTrue()
            ->delivery_address->toBe('Waterfront Hotel, Lahug');
    });

    test('delivery needs an address', function () {
        $car = Car::factory()->create(['delivery_fee' => 50000]);

        $this->post(route('cars.bookings.store', $car), pricedRequest(3, 2, ['with_delivery' => '1']))
            ->assertSessionHasErrors(['delivery_address' => 'Tell the owner where to deliver the car.']);
    });

    test('a license photo is required when the owner asks for one, and stored privately', function () {
        Notification::fake();
        Storage::fake('local');
        $storefront = Storefront::factory()->onPlan()->create(['requires_license_photo' => true]);
        $car = Car::factory()->for($storefront->owner, 'owner')->create();

        $this->post(route('cars.bookings.store', $car), pricedRequest(3, 2))
            ->assertSessionHasErrors(['license_photo' => "Add a photo of your driver's license."]);

        $this->post(route('cars.bookings.store', $car), pricedRequest(3, 2, ['license_photo' => UploadedFile::fake()->image('license.jpg')]))
            ->assertSessionHasNoErrors();

        Storage::disk('local')->assertExists(Booking::sole()->license_photo_path);
    });
});
