<?php

use App\Models\Booking;
use App\Models\Car;
use App\Models\Review;
use App\Models\Storefront;
use App\Models\User;
use Inertia\Testing\AssertableInertia;
use Inertia\Testing\AssertableInertia as Assert;

test('a storefront lists only its own bookable cars with a fleet summary', function () {
    $storefront = Storefront::factory()->create(['slug' => 'abqcarrental']);
    $cheapest = Car::factory()->for($storefront->owner, 'owner')->create(['body_type' => 'pickup', 'daily_rate' => 129500]);
    Car::factory()->for($storefront->owner, 'owner')->create(['body_type' => 'van', 'daily_rate' => 300000]);
    Car::factory()->for($storefront->owner, 'owner')->pendingReview()->create();
    Car::factory()->create();

    $this->get('/abqcarrental')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('storefront/show')
            ->where('storefront.name', $storefront->name)
            ->has('cars.data', 2)
            ->where('summary.vehicleCount', 2)
            ->where('summary.lowestDailyRate', $cheapest->daily_rate)
            ->where('summary.bodyTypes', ['Pickup', 'Van']));
});

test('a storefront applies the catalog filters to its own fleet', function () {
    $storefront = Storefront::factory()->create();
    $van = Car::factory()->for($storefront->owner, 'owner')->create(['body_type' => 'van']);
    Car::factory()->for($storefront->owner, 'owner')->create(['body_type' => 'sedan']);

    $this->get(route('storefronts.show', [$storefront, 'body_type' => 'van']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('cars.data', 1)
            ->where('cars.data.0.id', $van->id));
});

test('a suspended lessor\'s storefront returns 404', function () {
    $storefront = Storefront::factory()->for(User::factory()->suspended(), 'owner')->create();

    $this->get(route('storefronts.show', $storefront))->assertNotFound();
});

test('a storefront car page shows the car with its booking calendar', function () {
    $storefront = Storefront::factory()->create();
    $car = Car::factory()->for($storefront->owner, 'owner')->create();

    $this->get(route('storefronts.cars.show', [$storefront, $car]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('storefront/car')
            ->where('car.id', $car->id)
            ->has('bookedRanges'));
});

test('a storefront does not show another lessor\'s car', function () {
    $storefront = Storefront::factory()->create();
    $otherCar = Car::factory()->create();

    $this->get(route('storefronts.cars.show', [$storefront, $otherCar]))->assertNotFound();
});

test('app pages keep working alongside root-level storefronts', function () {
    Storefront::factory()->create(['slug' => 'abqcarrental']);

    $this->get('/rent')->assertInertia(fn (Assert $page) => $page->component('rent/index'));
});

test('an unknown storefront address returns 404', function () {
    $this->get('/no-such-rental')->assertNotFound();
});

test('a storefront hides cars already reserved for the searched dates', function () {
    $storefront = Storefront::factory()->create();
    $booked = Car::factory()->for($storefront->owner, 'owner')->create();
    $free = Car::factory()->for($storefront->owner, 'owner')->create();
    Booking::factory()->for($booked)->confirmed()->between(
        today()->addDays(5)->toDateString(),
        today()->addDays(8)->toDateString(),
    )->create();

    $this->get(route('storefronts.show', [$storefront, 'start_date' => today()->addDays(6)->toDateString(), 'end_date' => today()->addDays(10)->toDateString()]))
        ->assertInertia(fn (Assert $page) => $page
            ->has('cars.data', 1)
            ->where('cars.data.0.id', $free->id));
});

test('a cancelled booking frees its dates in the storefront search', function () {
    $storefront = Storefront::factory()->create();
    $car = Car::factory()->for($storefront->owner, 'owner')->create();
    Booking::factory()->for($car)->cancelled()->between(
        today()->addDays(5)->toDateString(),
        today()->addDays(8)->toDateString(),
    )->create();

    $this->get(route('storefronts.show', [$storefront, 'start_date' => today()->addDays(5)->toDateString(), 'end_date' => today()->addDays(8)->toDateString()]))
        ->assertInertia(fn (Assert $page) => $page->has('cars.data', 1));
});

test('a storefront filters by maximum daily rate in pesos', function () {
    $storefront = Storefront::factory()->create();
    $match = Car::factory()->for($storefront->owner, 'owner')->create(['daily_rate' => 300000]);
    Car::factory()->for($storefront->owner, 'owner')->create(['daily_rate' => 500000]);

    $this->get(route('storefronts.show', [$storefront, 'max_rate' => 3000]))
        ->assertInertia(fn (Assert $page) => $page
            ->has('cars.data', 1)
            ->where('cars.data.0.id', $match->id));
});

test('a storefront car page lists booked ranges without the owner\'s contact details', function () {
    $storefront = Storefront::factory()->create();
    $car = Car::factory()->for($storefront->owner, 'owner')->create();
    Booking::factory()->for($car)->between(
        today()->addDays(2)->toDateString(),
        today()->addDays(4)->toDateString(),
    )->create();

    $this->get(route('storefronts.cars.show', [$storefront, $car]))
        ->assertInertia(fn (Assert $page) => $page
            ->missing('car.owner')
            ->has('bookedRanges', 1)
            ->where('bookedRanges.0.start_date', today()->addDays(2)->toDateString()));
});

test('a storefront car page returns 404 for a listing that is not approved', function () {
    $storefront = Storefront::factory()->create();
    $car = Car::factory()->for($storefront->owner, 'owner')->pendingReview()->create();

    $this->get(route('storefronts.cars.show', [$storefront, $car]))->assertNotFound();
});

test('the booking page shows written reviews with a short renter name and the owner\'s reply', function () {
    $storefront = Storefront::factory()->create();
    $car = Car::factory()->for($storefront->owner, 'owner')->create();
    Review::factory()
        ->for(Booking::factory()->for($car)->completed()->state(['renter_name' => 'Juan Dela Cruz']))
        ->create(['rating' => 5, 'comment' => 'Clean car!', 'owner_reply' => 'Salamat!']);
    Review::factory()->for(Booking::factory()->for($car)->completed())->create(['comment' => null]);

    $this->get(route('storefronts.show', $storefront))
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has('reviews', 1)
            ->where('reviews.0.renter', 'Juan D.')
            ->where('reviews.0.owner_reply', 'Salamat!'));

    $this->get(route('storefronts.cars.show', [$storefront, $car]))
        ->assertInertia(fn (AssertableInertia $page) => $page->has('reviews', 1)->where('reviewSummary.count', 2));
});

test('the booking page lists the 3 latest written reviews and how many there are in all', function () {
    $storefront = Storefront::factory()->create();
    $car = Car::factory()->for($storefront->owner, 'owner')->create();
    foreach (range(1, 5) as $day) {
        Review::factory()->for(Booking::factory()->for($car)->completed())
            ->create(['comment' => "Review {$day}", 'created_at' => now()->subDays(10 - $day)]);
    }
    Review::factory()->for(Booking::factory()->for($car)->completed())->create(['comment' => null]);

    $this->get(route('storefronts.show', $storefront))
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has('reviews', 3)
            ->where('reviews.0.comment', 'Review 5')
            ->where('writtenReviewCount', 5));
});

test('the reviews page has every written review, the average and how ratings spread', function () {
    $storefront = Storefront::factory()->create();
    $car = Car::factory()->for($storefront->owner, 'owner')->create();
    $otherCar = Car::factory()->for($storefront->owner, 'owner')->create();
    foreach ([5, 5, 4, 2] as $rating) {
        Review::factory()->for(Booking::factory()->for($car)->completed())->create(['rating' => $rating, 'comment' => 'Noted']);
    }
    Review::factory()->for(Booking::factory()->for($otherCar)->completed())->create(['rating' => 3, 'comment' => null]);

    $this->get(route('storefronts.reviews', $storefront))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('storefront/reviews')
            ->has('reviews.data', 4)
            ->where('summary.count', 5)
            ->where('summary.average', 3.8)
            ->where('summary.breakdown', ['5' => 2, '4' => 1, '3' => 1, '2' => 1, '1' => 0])
            ->where('car', null));

    $this->get(route('storefronts.reviews', [$storefront, 'car' => $otherCar->slug]))
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('car.slug', $otherCar->slug)
            ->has('reviews.data', 0)
            ->where('summary.count', 1));
});

test('a closed business has no reviews page', function () {
    $storefront = Storefront::factory()->for(User::factory()->suspended(), 'owner')->create();

    $this->get(route('storefronts.reviews', $storefront))->assertNotFound();
});
