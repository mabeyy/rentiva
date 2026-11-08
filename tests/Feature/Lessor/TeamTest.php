<?php

use App\Enums\BookingStatus;
use App\Enums\UserRole;
use App\Models\Booking;
use App\Models\Car;
use App\Models\Plan;
use App\Models\Storefront;
use App\Models\Subscription;
use App\Models\TeamMember;
use App\Models\User;
use App\Notifications\StaffInvitation;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->storefront = Storefront::factory()->create();
    $this->owner = $this->storefront->owner;
});

/** A staff member of the test owner with the given permissions. */
function staffWith(User $owner, array $permissions): User
{
    return TeamMember::factory()->for($owner, 'owner')->create(['permissions' => $permissions])->user;
}

test('an owner invites staff, who get an email to choose a password', function () {
    Notification::fake();

    $this->actingAs($this->owner)->post(route('lessor.team.store'), [
        'name' => 'Ana Reyes',
        'email' => 'ana@example.com',
        'permissions' => ['bookings', 'customers'],
    ])->assertSessionHasNoErrors();

    $staff = User::where('email', 'ana@example.com')->sole();
    expect($staff->role)->toBe(UserRole::Staff)
        ->and($staff->teamMembership->permissions)->toBe(['bookings', 'customers']);
    Notification::assertSentTo($staff, StaffInvitation::class);
});

test('staff work in the owner\'s area, limited to their permissions', function () {
    $car = Car::factory()->for($this->owner, 'owner')->create();
    $booking = Booking::factory()->for($car)->create();
    $staff = staffWith($this->owner, ['bookings']);
    $this->actingAs($staff);

    $this->get(route('lessor.bookings.show', $booking))->assertOk();
    $this->get(route('lessor.dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('stats.monthEarnings', null)
            ->where('workspace.owner_name', $this->storefront->name)
            ->where('auth.user.email', $staff->email));

    $this->get(route('lessor.cars.index'))->assertForbidden();
    $this->get(route('lessor.transfers'))->assertForbidden();
    $this->get(route('lessor.revenue.index'))->assertForbidden();
    $this->get(route('lessor.payments.edit'))->assertForbidden();
    $this->get(route('lessor.team.index'))->assertForbidden();
});

test('what staff do is logged under their own name', function () {
    $booking = Booking::factory()->for(Car::factory()->for($this->owner, 'owner'))->create();
    $staff = staffWith($this->owner, ['bookings']);

    $this->actingAs($staff)->patch(route('lessor.bookings.update', $booking), ['status' => BookingStatus::Confirmed->value]);

    expect($booking->fresh()->status)->toBe(BookingStatus::Confirmed)
        ->and($booking->events()->latest('id')->first())
        ->actor_type->toBe('staff')
        ->actor_name->toBe($staff->name);
});

test('staff can\'t touch another owner\'s bookings', function () {
    $otherBooking = Booking::factory()->create();

    $this->actingAs(staffWith($this->owner, ['bookings']))
        ->get(route('lessor.bookings.show', $otherBooking))
        ->assertForbidden();
});

test('an owner changes access and removes staff', function () {
    $staff = staffWith($this->owner, ['bookings']);
    $member = $staff->teamMembership;
    $this->actingAs($this->owner);

    $this->put(route('lessor.team.update', $member), ['permissions' => ['cars']])->assertSessionHasNoErrors();
    expect($member->fresh()->permissions)->toBe(['cars']);

    $this->delete(route('lessor.team.destroy', $member));
    expect(User::find($staff->id))->toBeNull();
});

test('the plan\'s staff limit is enforced', function () {
    Subscription::factory()->for($this->owner, 'owner')->for(Plan::factory()->state(['max_staff' => 1]))->create();
    staffWith($this->owner, ['bookings']);

    $this->actingAs($this->owner)->post(route('lessor.team.store'), [
        'name' => 'Ben', 'email' => 'ben@example.com', 'permissions' => ['bookings'],
    ])->assertSessionHasErrors('email');
});

test('an owner resends an invitation', function () {
    Notification::fake();
    $staff = staffWith($this->owner, ['bookings']);

    $this->actingAs($this->owner)
        ->post(route('lessor.team.resend', $staff->teamMembership))
        ->assertSessionHasNoErrors();

    Notification::assertSentTo($staff, StaffInvitation::class);
});
