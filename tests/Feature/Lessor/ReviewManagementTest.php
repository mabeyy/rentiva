<?php

use App\Models\Booking;
use App\Models\Car;
use App\Models\Review;
use App\Models\User;
use Illuminate\Support\Facades\URL;
use Inertia\Testing\AssertableInertia as Assert;

test('an owner sees their reviews with the rating breakdown', function () {
    $car = Car::factory()->create();
    Review::factory()->for(Booking::factory()->for($car)->completed())->create(['rating' => 5]);
    Review::factory()->for(Booking::factory()->for($car)->completed())->create(['rating' => 3]);
    Review::factory()->create();

    $this->actingAs($car->owner)
        ->get(route('lessor.reviews.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('reviews.data', 2)
            ->has('reviews.meta.last_page')
            ->where('summary.count', 2)
            ->where('summary.average', 4)
            ->where('summary.breakdown.5', 1)
            ->where('summary.unanswered', 2));

    $this->get(route('lessor.reviews.index', ['rating' => 3]))
        ->assertInertia(fn (Assert $page) => $page->has('reviews.data', 1)->where('reviews.data.0.rating', 3));

    $this->get(route('lessor.reviews.index', ['car' => $car->slug]))
        ->assertInertia(fn (Assert $page) => $page
            ->has('reviews.data', 2)
            ->where('cars.0.slug', $car->slug)
            ->where('cars.0.average', 4));
});

test('an owner replies to a review and the renter sees it on their booking', function () {
    $review = Review::factory()->create();
    $booking = $review->booking;

    $this->actingAs($booking->car->owner)
        ->put(route('lessor.reviews.reply', $review), ['owner_reply' => 'Thanks for renting with us!'])
        ->assertSessionHasNoErrors();

    expect($review->fresh())->owner_reply->toBe('Thanks for renting with us!')->replied_at->not->toBeNull();

    auth()->logout();
    $this->get(URL::signedRoute('bookings.show', $booking))
        ->assertInertia(fn (Assert $page) => $page->where('review.owner_reply', 'Thanks for renting with us!'));
});

test('owners can\'t reply to other owners\' reviews', function () {
    $review = Review::factory()->create();

    $this->actingAs(User::factory()->create())
        ->put(route('lessor.reviews.reply', $review), ['owner_reply' => 'Hi'])
        ->assertForbidden();
});
