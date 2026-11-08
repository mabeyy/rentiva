<?php

use App\Enums\CarStatus;
use App\Models\Booking;
use App\Models\Car;
use App\Models\PickupLocation;
use App\Models\Plan;
use App\Models\Storefront;
use App\Models\Subscription;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('an owner exports their bookings and renters as CSV', function () {
    $car = Car::factory()->for(Storefront::factory()->onPlan()->create()->owner, 'owner')->create(['plate_number' => 'ABC 1234']);
    Booking::factory()->for($car)->create(['renter_name' => 'Juan Dela Cruz', 'total' => 450000]);
    Booking::factory()->create(['renter_name' => 'Someone Else']);
    $this->actingAs($car->owner);

    $bookings = $this->get(route('lessor.bookings.export'))->assertOk()->streamedContent();
    expect($bookings)->toContain('Juan Dela Cruz')->toContain('ABC 1234')->toContain('4500.00')->not->toContain('Someone Else');

    $renters = $this->get(route('lessor.renters.export'))->assertOk()->streamedContent();
    expect($renters)->toContain('Juan Dela Cruz')->not->toContain('Someone Else');
});

test('new owners see a setup checklist that goes away when everything is done', function () {
    $owner = User::factory()->create();
    $this->actingAs($owner);

    $this->get(route('lessor.dashboard'))
        ->assertInertia(fn (Assert $page) => $page->where('checklist.0.key', 'storefront')->where('checklist.0.done', false));

    $storefront = Storefront::factory()->for($owner, 'owner')->create();
    PickupLocation::factory()->for($owner, 'owner')->create();
    Car::factory()->for($owner, 'owner')->create(['status' => CarStatus::Active]);
    Subscription::factory()->for($owner, 'owner')->for(Plan::factory())->create();

    $this->actingAs($owner->fresh())
        ->get(route('lessor.dashboard'))
        ->assertInertia(fn (Assert $page) => $page->where('checklist', null));
});
