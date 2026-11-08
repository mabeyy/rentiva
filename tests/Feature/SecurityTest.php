<?php

use App\Enums\BookingStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Models\Booking;
use App\Models\BookingInspection;
use App\Models\Car;
use App\Models\CarService;
use App\Models\PeakSeason;
use App\Models\Review;
use App\Models\Storefront;
use App\Models\TeamMember;
use App\Models\User;
use App\Notifications\BookingRequested;
use Illuminate\Support\Facades\URL;

/**
 * Every owner action on a single booking, so none of them can be reached
 * with another owner's booking.
 *
 * @return array<string, array{0: string, 1: string, 2: array<string, mixed>}>
 */
function ownerBookingEndpoints(): array
{
    return [
        'view booking' => ['get', 'lessor.bookings.show', []],
        'change status' => ['patch', 'lessor.bookings.update', ['status' => 'confirmed']],
        'license photo' => ['get', 'lessor.bookings.license.show', []],
        'check license' => ['put', 'lessor.bookings.license.update', ['checked' => true]],
        'receipt' => ['get', 'lessor.bookings.receipt', []],
        'agreement' => ['get', 'lessor.bookings.agreement', []],
        'change trip' => ['put', 'lessor.bookings.trip.update', []],
        'add charge' => ['post', 'lessor.bookings.charges.store', ['label' => 'x', 'amount' => 1]],
        'deposit' => ['put', 'lessor.bookings.deposit.update', ['action' => 'collected']],
        'inspection' => ['post', 'lessor.bookings.inspections.store', ['type' => 'pickup', 'fuel_level' => 8, 'odometer' => 1]],
        'refund' => ['put', 'lessor.bookings.refund.update', ['amount' => 1]],
        'approve change' => ['post', 'lessor.bookings.change-request.approve', []],
        'payment proof' => ['get', 'lessor.bookings.payment.proof', []],
        'approve payment' => ['post', 'lessor.bookings.payment.approve', []],
    ];
}

test('owners can\'t act on another owner\'s booking', function (string $method, string $route, array $payload) {
    $booking = Booking::factory()->for(Car::factory()->for(Storefront::factory()->onPlan()->create()->owner, 'owner'))->create([
        'status' => BookingStatus::Cancelled,
        'payment_method' => PaymentMethod::BankTransfer,
        'payment_status' => PaymentStatus::Paid,
        'change_request' => ['start_date' => today()->addDay()->toDateString(), 'end_date' => today()->addDays(2)->toDateString(), 'note' => null, 'requested_at' => now()->toIso8601String()],
    ]);
    $intruder = Storefront::factory()->onPlan()->create()->owner;

    $this->actingAs($intruder)->{$method}(route($route, $booking), $payload)->assertForbidden();
})->with(ownerBookingEndpoints());

test('owners can\'t touch another owner\'s cars, seasons, reviews, inspections or staff', function () {
    $owner = Storefront::factory()->onPlan()->create()->owner;
    $car = Car::factory()->for($owner, 'owner')->create();
    $service = CarService::factory()->for($car)->create();
    $season = PeakSeason::factory()->for($owner, 'owner')->create();
    $review = Review::factory()->for(Booking::factory()->for($car)->completed())->create();
    $inspection = BookingInspection::factory()->for($review->booking)->create(['photos' => ['inspections/x.jpg']]);
    $member = TeamMember::factory()->for($owner, 'owner')->create();
    $this->actingAs(Storefront::factory()->onPlan()->create()->owner);

    $this->get(route('lessor.cars.edit', $car))->assertForbidden();
    $this->delete(route('lessor.cars.services.destroy', [$car, $service]))->assertForbidden();
    $this->put(route('lessor.seasons.update', $season), ['name' => 'x', 'start_date' => '2027-01-01', 'end_date' => '2027-01-02', 'rate_change' => 10])->assertForbidden();
    $this->put(route('lessor.reviews.reply', $review), ['owner_reply' => 'x'])->assertForbidden();
    $this->get(route('lessor.bookings.inspections.photo', [$review->booking, $inspection, 0]))->assertForbidden();
    $this->delete(route('lessor.team.destroy', $member))->assertForbidden();
});

test('staff never reach admin pages or other owners', function () {
    $staff = TeamMember::factory()->create(['permissions' => array_keys(TeamMember::PERMISSIONS)])->user;

    $this->actingAs($staff)->get(route('admin.dashboard'))->assertForbidden();
    $this->post(route('admin.lessors.impersonate', Storefront::factory()->create()->owner))->assertForbidden();
});

test('an admin viewing as an owner can\'t change the owner\'s account', function () {
    $owner = Storefront::factory()->create()->owner;
    $this->actingAs(User::factory()->admin()->create())->post(route('admin.lessors.impersonate', $owner));

    $this->get(route('profile.edit'))->assertRedirect(route('lessor.dashboard'));
    $this->patch(route('profile.update'), ['name' => 'Hijacked', 'email' => 'x@example.com'])->assertForbidden();
    $this->put(route('user-password.update'), ['password' => 'new-password'])->assertForbidden();

    expect($owner->fresh()->name)->not->toBe('Hijacked');
});

test('renter links only work when signed', function () {
    $booking = Booking::factory()->confirmed()->create();

    $this->get(route('bookings.show', $booking))->assertForbidden();
    $this->post(route('bookings.change-request.store', $booking), [])->assertForbidden();
    $this->delete(route('bookings.destroy', $booking))->assertForbidden();
    $this->get(URL::signedRoute('bookings.show', $booking))->assertOk();
});

test('renter-typed text is escaped in emails and printed documents', function () {
    $booking = Booking::factory()->create([
        'renter_name' => "Juan <script>alert('x')</script>",
        'notes' => '<img src=x onerror=alert(1)>',
    ]);

    $mail = (string) (new BookingRequested($booking))->toMail($booking->car->owner)->render();
    expect($mail)->toContain('&lt;script&gt;')->not->toContain("<script>alert('x')</script>");

    $this->actingAs($booking->car->owner)
        ->get(route('lessor.bookings.agreement', $booking))
        ->assertOk()
        ->assertDontSee("<script>alert('x')</script>", false)
        ->assertSee('&lt;script&gt;', false);
});
