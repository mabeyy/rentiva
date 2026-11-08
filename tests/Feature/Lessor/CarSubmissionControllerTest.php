<?php

use App\Enums\CarStatus;
use App\Models\Car;

test('a lessor submits a draft for review', function () {
    $car = Car::factory()->draft()->create();

    $this->actingAs($car->owner)->post(route('lessor.cars.submission.store', $car));

    expect($car->fresh()->status)->toBe(CarStatus::PendingReview);
});

test('a rejected listing can be resubmitted and its rejection reason is cleared', function () {
    $car = Car::factory()->create(['status' => CarStatus::Rejected, 'rejection_reason' => 'Blurry photos']);

    $this->actingAs($car->owner)->post(route('lessor.cars.submission.store', $car));

    expect($car->fresh())
        ->status->toBe(CarStatus::PendingReview)
        ->rejection_reason->toBeNull();
});

test('an active listing cannot be resubmitted', function () {
    $car = Car::factory()->create();

    $this->actingAs($car->owner)
        ->post(route('lessor.cars.submission.store', $car))
        ->assertForbidden();
});
