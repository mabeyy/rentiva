<?php

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Car;
use App\Models\Storefront;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('an admin views the app as an owner, and their changes are logged under the admin', function () {
    $admin = User::factory()->admin()->create(['name' => 'Rentiva Support']);
    $storefront = Storefront::factory()->create();
    $booking = Booking::factory()->for(Car::factory()->for($storefront->owner, 'owner'))->create();

    $this->actingAs($admin)
        ->post(route('admin.lessors.impersonate', $storefront->owner))
        ->assertRedirect(route('lessor.dashboard'));
    $this->assertAuthenticatedAs($storefront->owner);

    $this->get(route('lessor.dashboard'))
        ->assertInertia(fn (Assert $page) => $page->where('impersonation.admin_name', 'Rentiva Support'));

    $this->patch(route('lessor.bookings.update', $booking), ['status' => BookingStatus::Confirmed->value]);
    expect($booking->events()->latest('id')->first())
        ->actor_type->toBe('admin')
        ->actor_name->toBe('Rentiva Support');

    $this->post(route('impersonation.stop'))->assertRedirect(route('admin.lessors.show', $storefront->owner));
    $this->assertAuthenticatedAs($admin);
});

test('only admins can view as an owner, and never as another admin', function () {
    $owner = Storefront::factory()->create()->owner;

    $this->actingAs(User::factory()->create())->post(route('admin.lessors.impersonate', $owner))->assertForbidden();
    $this->actingAs(User::factory()->admin()->create())->post(route('admin.lessors.impersonate', User::factory()->admin()->create()))->assertNotFound();
    $this->actingAs($owner)->post(route('impersonation.stop'))->assertForbidden();
});
