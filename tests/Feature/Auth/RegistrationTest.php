<?php

use App\Models\Storefront;
use App\Models\User;
use Laravel\Fortify\Features;

beforeEach(function () {
    $this->skipUnlessFortifyHas(Features::registration());
});

test('registration screen can be rendered', function () {
    $response = $this->get(route('register'));

    $response->assertOk();
});

test('new users can register', function () {
    $response = $this->post(route('register.store'), [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'business_name' => 'ABQ Car Rental',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('dashboard', absolute: false));
});

test('registering creates a booking page addressed after the business name', function () {
    Storefront::factory()->create(['slug' => 'abq-car-rental']);

    $this->post(route('register.store'), [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'business_name' => 'ABQ Car Rental',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    expect(User::where('email', 'test@example.com')->sole()->storefront)
        ->name->toBe('ABQ Car Rental')
        ->slug->toBe('abq-car-rental-2');
});

test('registration requires a business name', function () {
    $this->post(route('register.store'), [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ])->assertSessionHasErrors(['business_name' => 'The business name field is required.']);

    $this->assertGuest();
});

test('a business name matching an app page gets a non-conflicting address', function () {
    $this->post(route('register.store'), [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'business_name' => 'Cars',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    expect(User::where('email', 'test@example.com')->sole()->storefront->slug)->toBe('cars-2');
});
