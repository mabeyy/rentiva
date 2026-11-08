<?php

use App\Models\Car;
use App\Models\User;
use App\Notifications\CarPaperExpiring;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;

test('an owner logs and removes services on their car', function () {
    $car = Car::factory()->create();
    $this->actingAs($car->owner);

    $this->post(route('lessor.cars.services.store', $car), [
        'serviced_on' => today()->subDays(3)->toDateString(),
        'odometer' => 45000,
        'description' => 'Change oil and filter',
        'cost' => 2500,
    ])->assertSessionHasNoErrors();

    $service = $car->services()->sole();
    expect($service)->cost->toBe(250000)->odometer->toBe(45000);

    $this->get(route('lessor.cars.edit', $car))
        ->assertInertia(fn (Assert $page) => $page->where('services.0.description', 'Change oil and filter'));

    $this->delete(route('lessor.cars.services.destroy', [$car, $service]));
    expect($car->services()->count())->toBe(0);
});

test('other owners can\'t log services on the car', function () {
    $car = Car::factory()->create();

    $this->actingAs(User::factory()->create())
        ->post(route('lessor.cars.services.store', $car), ['serviced_on' => today()->toDateString(), 'description' => 'x'])
        ->assertForbidden();
});

test('owners are reminded 30 days, 7 days and on the day papers run out', function () {
    Notification::fake();
    $soon = Car::factory()->create(['registration_expires_on' => today()->addDays(30)->toDateString()]);
    $today = Car::factory()->create(['insurance_expires_on' => today()->toDateString()]);
    Car::factory()->create(['registration_expires_on' => today()->addDays(12)->toDateString()]);

    $this->artisan('cars:remind-papers')->assertSuccessful();

    Notification::assertSentTo($soon->owner, CarPaperExpiring::class, fn (CarPaperExpiring $notification) => $notification->paper === 'registration' && $notification->daysLeft === 30);
    Notification::assertSentTo($today->owner, CarPaperExpiring::class, fn (CarPaperExpiring $notification) => $notification->paper === 'insurance' && $notification->daysLeft === 0);
    Notification::assertCount(2);
});
