<?php

use App\Models\Car;
use App\Models\CarImage;
use App\Models\Storefront;
use App\Models\User;

test('the sitemap lists open booking pages and their listed cars only', function () {
    $storefront = Storefront::factory()->create(['slug' => 'abq-car-rental']);
    $listed = Car::factory()->for($storefront->owner, 'owner')->create();
    $draft = Car::factory()->draft()->for($storefront->owner, 'owner')->create();
    $closed = Storefront::factory()->for(User::factory()->suspended(), 'owner')->create(['slug' => 'closed-rentals']);
    Car::factory()->for($closed->owner, 'owner')->create();

    $response = $this->get('/sitemap.xml');

    $response->assertOk()
        ->assertHeader('Content-Type', 'application/xml')
        ->assertSee(route('rent'), false)
        ->assertSee(route('storefronts.show', $storefront), false)
        ->assertSee(route('storefronts.cars.show', [$storefront, $listed]), false)
        ->assertDontSee(route('storefronts.cars.show', [$storefront, $draft]), false)
        ->assertDontSee('closed-rentals', false);
});

test('robots.txt keeps crawlers out of dashboards and points to the sitemap', function () {
    $this->get('/robots.txt')
        ->assertOk()
        ->assertSee('Disallow: /lessor')
        ->assertSee('Disallow: /bookings/')
        ->assertSee('Sitemap: '.route('sitemap'), false);
});

test('a car page renders its link preview on the server, with its first photo', function () {
    $storefront = Storefront::factory()->create(['name' => 'ABQ Car Rental']);
    $car = Car::factory()->for($storefront->owner, 'owner')->create(['make' => 'Toyota', 'model' => 'Vios', 'year' => 2024, 'daily_rate' => 250000]);
    $photo = CarImage::factory()->for($car)->create(['position' => 0]);

    $this->get(route('storefronts.cars.show', [$storefront, $car]))
        ->assertOk()
        ->assertSee('<meta property="og:title" content="2024 Toyota Vios for rent | ABQ Car Rental">', false)
        ->assertSee('for ₱2,500/day', false)
        ->assertSee('<meta property="og:image" content="'.$photo->url.'">', false);
});

test('a booking page preview uses the owner\'s tagline, escaped', function () {
    $storefront = Storefront::factory()->create(['tagline' => 'Cebu\'s "best" <rentals>']);
    Car::factory()->for($storefront->owner, 'owner')->create();

    $this->get(route('storefronts.show', $storefront))
        ->assertOk()
        ->assertSee('<meta name="description" content="Cebu&#039;s &quot;best&quot; &lt;rentals&gt;">', false);
});
