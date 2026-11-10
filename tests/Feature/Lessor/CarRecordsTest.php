<?php

use App\Models\Car;
use App\Models\Storefront;
use App\Models\TeamMember;
use App\Models\User;
use App\Notifications\CarPaperExpiring;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;

test('an owner logs and removes services on their car', function () {
    $car = Car::factory()->create();
    $this->actingAs($car->owner);

    $this->post(route('lessor.cars.services.store', $car), [
        'serviced_on' => today()->subDays(3)->toDateString(),
        'odometer' => 45000,
        'description' => 'Change oil and filter',
        'cost' => 2500,
    ])->assertSessionHasNoErrors();

    $service = $car->services()->sole();
    expect($service)->cost->toBe(250000)->odometer->toBe(45000);

    $this->get(route('lessor.cars.edit', $car))
        ->assertInertia(fn (Assert $page) => $page->where('services.0.description', 'Change oil and filter'));

    $this->delete(route('lessor.cars.services.destroy', [$car, $service]));
    expect($car->services()->count())->toBe(0);
});

test('other owners can\'t log services on the car', function () {
    $car = Car::factory()->create();

    $this->actingAs(User::factory()->create())
        ->post(route('lessor.cars.services.store', $car), ['serviced_on' => today()->toDateString(), 'description' => 'x'])
        ->assertForbidden();
});

test('owners are reminded 30 days, 7 days and on the day papers run out, each once, catching up a missed day', function () {
    Notification::fake();
    $soon = Car::factory()->create(['registration_expires_on' => today()->addDays(30)->toDateString()]);
    $today = Car::factory()->create(['registration_expires_on' => today()->toDateString()]);
    $missed = Car::factory()->create(['registration_expires_on' => today()->addDays(12)->toDateString()]);
    Car::factory()->create(['registration_expires_on' => today()->addDays(45)->toDateString()]);

    $this->artisan('cars:remind-papers')->assertSuccessful();
    $this->artisan('cars:remind-papers')->assertSuccessful();

    Notification::assertSentTo($soon->owner, CarPaperExpiring::class, fn (CarPaperExpiring $notification) => $notification->paper === 'registration' && $notification->daysLeft === 30);
    Notification::assertSentTo($today->owner, CarPaperExpiring::class, fn (CarPaperExpiring $notification) => $notification->daysLeft === 0);
    // The 30-day reminder it missed goes out late, once.
    Notification::assertSentTo($missed->owner, CarPaperExpiring::class, fn (CarPaperExpiring $notification) => $notification->daysLeft === 12);
    Notification::assertCount(3);

    $this->travel(5)->days();
    $this->artisan('cars:remind-papers');
    Notification::assertSentTo($missed->owner, CarPaperExpiring::class, fn (CarPaperExpiring $notification) => $notification->daysLeft === 7);
    Notification::assertCount(4);
});

test('the maintenance page lists cars needing attention first, with this year\'s spending', function () {
    $owner = User::factory()->create();
    $upToDate = Car::factory()->for($owner, 'owner')->create(['make' => 'Aaa', 'registration_expires_on' => today()->addYear()->toDateString()]);
    $upToDate->services()->create(['serviced_on' => today()->subDays(20), 'description' => 'Change oil', 'cost' => 300000]);
    $upToDate->services()->create(['serviced_on' => today()->subYear()->startOfYear(), 'description' => 'Old tires', 'cost' => 900000]);
    $registrationDue = Car::factory()->for($owner, 'owner')->create(['make' => 'Bbb', 'registration_expires_on' => today()->addDays(10)->toDateString()]);
    $registrationDue->services()->create(['serviced_on' => today()->subDays(5), 'description' => 'Wash', 'cost' => 50000]);
    $neverServiced = Car::factory()->for($owner, 'owner')->create(['make' => 'Ccc']);

    $this->actingAs($owner)
        ->get(route('lessor.maintenance'))
        ->assertInertia(fn ($page) => $page
            ->component('lessor/maintenance')
            ->where('summary.needs_attention', 2)
            ->where('summary.spent_this_year', 350000)
            ->where('summary.services_this_year', 2)
            ->where('cars.0.needs_attention', true)
            ->where('cars.1.needs_attention', true)
            ->where('cars.2.slug', $upToDate->slug)
            ->where('cars.2.days_since_service', 20)
            ->where('cars.2.spent_this_year', 300000));

    expect([$registrationDue->slug, $neverServiced->slug])->toContain(
        $this->get(route('lessor.maintenance'))->inertiaProps('cars.0.slug'),
    );
});

test('staff without the cars permission can\'t open maintenance', function () {
    $owner = Storefront::factory()->create()->owner;
    $staff = TeamMember::factory()->for($owner, 'owner')->create(['permissions' => ['bookings']])->user;

    $this->actingAs($staff)->get(route('lessor.maintenance'))->assertForbidden();
});
