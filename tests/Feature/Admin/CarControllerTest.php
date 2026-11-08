<?php

use App\Enums\CarStatus;
use App\Models\Car;
use App\Models\User;
use App\Notifications\CarStatusChanged;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;

test('an admin approves a listing and the owner is notified', function () {
    Notification::fake();
    $car = Car::factory()->pendingReview()->create();

    $this->actingAs(User::factory()->admin()->create())
        ->patch(route('admin.cars.update', $car), ['status' => 'active'])
        ->assertSessionHasNoErrors();

    expect($car->fresh()->status)->toBe(CarStatus::Active);
    Notification::assertSentTo($car->owner, CarStatusChanged::class);
});

test('rejecting or suspending a listing requires a reason', function (string $status) {
    $car = Car::factory()->pendingReview()->create();

    $this->actingAs(User::factory()->admin()->create())
        ->patch(route('admin.cars.update', $car), ['status' => $status])
        ->assertSessionHasErrors('reason');

    expect($car->fresh()->status)->toBe(CarStatus::PendingReview);
})->with(['rejected', 'suspended']);

test('a rejection reason is stored for the lessor', function () {
    Notification::fake();
    $car = Car::factory()->pendingReview()->create();

    $this->actingAs(User::factory()->admin()->create())
        ->patch(route('admin.cars.update', $car), ['status' => 'rejected', 'reason' => 'Photos are blurry']);

    expect($car->fresh())
        ->status->toBe(CarStatus::Rejected)
        ->rejection_reason->toBe('Photos are blurry');
});

test('an admin cannot move a listing back to draft or pending review', function (string $status) {
    $car = Car::factory()->create();

    $this->actingAs(User::factory()->admin()->create())
        ->patch(route('admin.cars.update', $car), ['status' => $status])
        ->assertSessionHasErrors('status');
})->with(['draft', 'pending_review']);

test('the listing review page includes the owner\'s contact details', function () {
    $car = Car::factory()->pendingReview()->create();

    $this->actingAs(User::factory()->admin()->create())
        ->get(route('admin.cars.show', $car))
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/cars/show')
            ->where('owner.email', $car->owner->email));
});

test('the listings page filters by status', function () {
    $pending = Car::factory()->pendingReview()->create();
    Car::factory()->create();

    $this->actingAs(User::factory()->admin()->create())
        ->get(route('admin.cars.index', ['status' => 'pending_review']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('cars.data', 1)
            ->where('cars.data.0.id', $pending->id));
});
