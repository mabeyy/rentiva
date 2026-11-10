<?php

use App\Enums\BookingSource;
use App\Models\Booking;
use App\Models\Car;
use App\Models\PageVisit;
use App\Models\Storefront;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->storefront = Storefront::factory()->create();
    $this->car = Car::factory()->for($this->storefront->owner, 'owner')->create();
});

test('a renter opening a car page is counted once a day, with Facebook as the source', function () {
    $carPage = route('storefronts.cars.show', [$this->storefront, $this->car]);

    $this->get($carPage, ['Referer' => 'https://m.facebook.com/'])->assertOk();
    $this->get($carPage)->assertOk();

    expect(PageVisit::count())->toBe(2)
        ->and(PageVisit::distinct()->count('visitor'))->toBe(1)
        ->and(PageVisit::first())
        ->page->toBe('car')
        ->storefront_id->toBe($this->storefront->id)
        ->car_id->toBe($this->car->id)
        ->source->toBe('facebook.com');
});

test('owners, bots and filter reloads are not counted', function (Closure $visit) {
    $visit($this);

    expect(PageVisit::count())->toBe(0);
})->with([
    'signed-in owner' => [fn ($test) => $test->actingAs($test->storefront->owner)->get(route('storefronts.show', $test->storefront))],
    'link-preview crawler' => [fn ($test) => $test->get(route('storefronts.show', $test->storefront), ['User-Agent' => 'facebookexternalhit/1.1'])],
    'filter reload' => [fn ($test) => $test->get(route('storefronts.show', $test->storefront), ['X-Inertia' => 'true', 'X-Inertia-Partial-Component' => 'storefront/show'])],
    'search typed on the same page' => [fn ($test) => $test->get(route('rent', ['search' => 'abq']), ['X-Inertia' => 'true', 'Referer' => route('rent')])],
]);

test('the owner dashboard shows visitors, online requests, sources and cars for the last 30 days', function () {
    PageVisit::factory()->count(3)->onStorefront($this->storefront)->create(['source' => 'facebook.com']);
    PageVisit::factory()->onStorefront($this->storefront, $this->car)->create();
    PageVisit::factory()->onStorefront($this->storefront)->create(['created_at' => now()->subDays(31)]);
    PageVisit::factory()->onStorefront(Storefront::factory()->create())->create();
    Booking::factory()->for($this->car)->create();
    Booking::factory()->for($this->car)->create(['source' => BookingSource::Phone]);

    $this->actingAs($this->storefront->owner)
        ->get(route('lessor.dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('traffic.visitors', 4)
            ->where('traffic.car_views', 1)
            ->where('traffic.requests', 1)
            ->where('traffic.request_rate', 25)
            ->where('traffic.sources.0', ['source' => 'facebook.com', 'visitors' => 3])
            ->where('traffic.cars.0', ['name' => $this->car->name, 'views' => 1, 'requests' => 1]));
});

test('the admin funnel follows new owners from the home page to their first request', function () {
    PageVisit::factory()->count(5)->create(['page' => 'home']);
    PageVisit::factory()->count(2)->create(['page' => 'register']);
    User::factory()->create();
    Booking::factory()->for($this->car)->create();

    $this->actingAs(User::factory()->admin()->create())
        ->get(route('admin.dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('traffic.owners', [
                'home_visitors' => 5,
                'signup_visitors' => 2,
                'signups' => 2,
                'added_car' => 1,
                'got_request' => 1,
            ]));
});

test('visits older than 13 months are pruned', function () {
    $old = PageVisit::factory()->create(['created_at' => now()->subMonths(13)->subDay()]);
    $recent = PageVisit::factory()->create(['created_at' => now()->subMonths(12)]);

    $this->artisan('model:prune', ['--model' => [PageVisit::class]])->assertSuccessful();

    expect(PageVisit::whereKey($old->id)->exists())->toBeFalse()
        ->and(PageVisit::whereKey($recent->id)->exists())->toBeTrue();
});
