<?php

use App\Models\Booking;
use App\Models\Car;
use App\Models\Invoice;
use App\Models\Storefront;
use App\Models\TeamMember;
use App\Models\User;
use App\Notifications\InvoiceIssued;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->storefront = Storefront::factory()->onPlan()->create();
    $this->owner = $this->storefront->owner;
    $this->car = Car::factory()->for($this->owner, 'owner')->create();
    $this->booking = Booking::factory()->for($this->car)->create(['renter_name' => 'Juan Dela Cruz']);
    $this->booking->recordEvent('payment_submitted', 'Reference BDO-1');
});

function staffMemberWith(array $permissions, User $owner): User
{
    return TeamMember::factory()->for($owner, 'owner')->create(['permissions' => $permissions])->user;
}

test('staff who don\'t handle bookings don\'t see renters on the dashboard or in the activity feed', function () {
    $carsStaff = staffMemberWith(['cars'], $this->owner);

    $this->actingAs($carsStaff)
        ->get(route('lessor.dashboard'))
        ->assertInertia(fn (Assert $page) => $page->has('pendingBookings', 0)->where('agenda', []));
    $this->get(route('lessor.activity'))
        ->assertInertia(fn (Assert $page) => $page->where('events.data', fn ($events): bool => collect($events)->every(fn (array $event): bool => $event['booking'] === null)));

    $this->actingAs(staffMemberWith(['bookings'], $this->owner))
        ->get(route('lessor.dashboard'))
        ->assertInertia(fn (Assert $page) => $page->has('pendingBookings', 1));
});

test('staff without the payments permission don\'t see money events or record refunds', function () {
    $bookingsStaff = staffMemberWith(['bookings'], $this->owner);

    $this->actingAs($bookingsStaff)
        ->get(route('lessor.activity'))
        ->assertInertia(fn (Assert $page) => $page->where('events.data', fn ($events): bool => collect($events)->doesntContain(fn (array $event): bool => $event['action'] === 'payment_submitted')));
    $this->put(route('lessor.bookings.refund.update', $this->booking), ['refund_amount' => 100])->assertForbidden();
});

test('staff only see the alerts their permissions cover, never the owner\'s invoices', function () {
    $this->owner->notify(new InvoiceIssued(Invoice::factory()->for($this->owner, 'owner')->create()));
    $ownerUnread = $this->owner->unreadNotifications()->count();
    $carsStaff = staffMemberWith(['cars'], $this->owner);

    $this->actingAs($carsStaff)
        ->get(route('lessor.dashboard'))
        ->assertInertia(fn (Assert $page) => $page->where('notifications.unread', 0)->where('notifications.items', []));

    $this->post(route('lessor.notifications.read'));
    expect($this->owner->unreadNotifications()->count())->toBe($ownerUnread);
});
