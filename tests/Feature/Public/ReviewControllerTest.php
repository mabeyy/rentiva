<?php

use App\Models\Booking;
use App\Models\Car;
use App\Models\Review;
use App\Models\Storefront;
use Illuminate\Support\Facades\URL;

function reviewUrl(Booking $booking): string
{
    return URL::signedRoute('bookings.review.store', $booking);
}

test('a guest rates their completed trip from the signed link', function () {
    $booking = Booking::factory()->completed()->create();

    $this->post(reviewUrl($booking), ['rating' => 5, 'comment' => 'Clean car, smooth pickup.'])
        ->assertRedirect($booking->manageUrl());

    expect($booking->review)
        ->rating->toBe(5)
        ->comment->toBe('Clean car, smooth pickup.')
        ->car_id->toBe($booking->car_id);
});

test('a trip that has not been completed cannot be rated', function (string $state) {
    $booking = Booking::factory()->{$state}()->create();

    $this->post(reviewUrl($booking), ['rating' => 5])->assertForbidden();

    expect(Review::count())->toBe(0);
})->with(['confirmed', 'cancelled']);

test('a trip can only be rated once', function () {
    $review = Review::factory()->create();

    $this->post(reviewUrl($review->booking), ['rating' => 1])->assertForbidden();

    expect($review->fresh()->rating)->not->toBe(1);
});

test('a review without a valid signature is rejected', function () {
    $booking = Booking::factory()->completed()->create();

    $this->post(route('bookings.review.store', $booking), ['rating' => 5])->assertForbidden();
});

test('a rating must be between one and five stars', function (mixed $rating) {
    $booking = Booking::factory()->completed()->create();

    $this->post(reviewUrl($booking), ['rating' => $rating])->assertSessionHasErrors('rating');
})->with([0, 6, null]);

test('the booking page offers the review form only for an unrated completed trip', function () {
    $booking = Booking::factory()->completed()->create();

    $this->get($booking->manageUrl())
        ->assertInertia(fn ($page) => $page->where('review', null)->whereNot('reviewUrl', null));

    Review::factory()->for($booking)->create(['car_id' => $booking->car_id, 'rating' => 4]);

    $this->get($booking->manageUrl())
        ->assertInertia(fn ($page) => $page->where('review.rating', 4)->where('reviewUrl', null));
});

test('an owner page shows the average rating across their cars', function () {
    $storefront = Storefront::factory()->create();
    foreach ([5, 4] as $rating) {
        $booking = Booking::factory()->completed()->for(
            Car::factory()->for($storefront->owner, 'owner'),
        )->create();
        Review::factory()->for($booking)->create(['car_id' => $booking->car_id, 'rating' => $rating]);
    }

    $this->get(route('storefronts.show', $storefront))
        ->assertInertia(fn ($page) => $page
            ->where('summary.reviewCount', 2)
            ->where('summary.averageRating', 4.5));
});
