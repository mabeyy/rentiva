<?php

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Car;
use App\Models\Storefront;
use App\Models\User;
use Illuminate\Support\Facades\URL;
use Inertia\Testing\AssertableInertia as Assert;

test('confirming a booking is logged under the owner\'s name', function () {
    $booking = Booking::factory()->create();

    $this->actingAs($booking->car->owner)
        ->patch(route('lessor.bookings.update', $booking), ['status' => BookingStatus::Confirmed->value]);

    expect($booking->events()->sole())
        ->action->toBe('confirmed')
        ->actor_type->toBe('owner')
        ->actor_name->toBe($booking->car->owner->name);
});

test('a guest cancelling their booking is logged under the renter\'s name', function () {
    $booking = Booking::factory()->confirmed()->create(['renter_name' => 'Juan Dela Cruz']);

    $this->delete(URL::signedRoute('bookings.destroy', $booking));

    expect($booking->events()->sole())
        ->action->toBe('cancelled')
        ->actor_type->toBe('renter')
        ->actor_name->toBe('Juan Dela Cruz');
});

test('an owner sees activity on their own bookings only', function () {
    $car = Car::factory()->create();
    $mine = Booking::factory()->for($car)->create(['renter_name' => 'Juan']);
    $mine->events()->create(['action' => 'requested', 'actor_type' => 'renter', 'actor_name' => 'Juan']);
    Booking::factory()->create()->events()->create(['action' => 'requested', 'actor_type' => 'renter', 'actor_name' => 'Someone else']);

    $this->actingAs($car->owner)
        ->get(route('lessor.activity'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('lessor/activity')
            ->has('events.data', 1)
            ->where('events.data.0.reference', $mine->reference)
            ->where('events.data.0.renter_name', 'Juan'));
});

test('activity can be filtered by action, by who and by search', function () {
    $car = Car::factory()->create();
    $booking = Booking::factory()->for($car)->create(['renter_name' => 'Maria Santos']);
    $booking->events()->create(['action' => 'requested', 'actor_type' => 'renter', 'actor_name' => 'Maria Santos']);
    $booking->events()->create(['action' => 'confirmed', 'actor_type' => 'owner', 'actor_name' => $car->owner->name]);
    Booking::factory()->for($car)->create(['renter_name' => 'Pedro'])
        ->events()->create(['action' => 'requested', 'actor_type' => 'renter', 'actor_name' => 'Pedro']);

    $this->actingAs($car->owner);

    $this->get(route('lessor.activity', ['action' => 'confirmed']))
        ->assertInertia(fn (Assert $page) => $page->has('events.data', 1));
    $this->get(route('lessor.activity', ['actor' => 'renter']))
        ->assertInertia(fn (Assert $page) => $page->has('events.data', 2));
    $this->get(route('lessor.activity', ['search' => 'maria']))
        ->assertInertia(fn (Assert $page) => $page->has('events.data', 2));
});

describe('admin', function () {
    test('an admin sees activity across every owner, with each owner named', function () {
        $first = Car::factory()->create();
        $second = Car::factory()->create();
        Booking::factory()->for($first)->create()->events()->create(['action' => 'requested', 'actor_type' => 'renter', 'actor_name' => 'Juan']);
        Booking::factory()->for($second)->create()->events()->create(['action' => 'confirmed', 'actor_type' => 'owner', 'actor_name' => $second->owner->name]);

        $this->actingAs(User::factory()->admin()->create())
            ->get(route('admin.activity'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/activity')
                ->has('events.data', 2)
                ->where('events.data.0.owner_name', $second->owner->name)
                ->has('owners'));
    });

    test('an admin can narrow the activity to one owner', function () {
        $storefront = Storefront::factory()->create();
        $car = Car::factory()->for($storefront->owner, 'owner')->create();
        Booking::factory()->for($car)->create()->events()->create(['action' => 'requested', 'actor_type' => 'renter', 'actor_name' => 'Juan']);
        Booking::factory()->create()->events()->create(['action' => 'requested', 'actor_type' => 'renter', 'actor_name' => 'Pedro']);

        $this->actingAs(User::factory()->admin()->create())
            ->get(route('admin.activity', ['owner' => $storefront->id]))
            ->assertInertia(fn (Assert $page) => $page
                ->has('events.data', 1)
                ->where('events.data.0.owner_name', $storefront->name));
    });

    test('owners cannot open the admin activity log', function () {
        $this->actingAs(Car::factory()->create()->owner)
            ->get(route('admin.activity'))
            ->assertForbidden();
    });
});
