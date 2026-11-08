<?php

use App\Enums\UserStatus;
use App\Models\Car;
use App\Models\Storefront;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('suspending a lessor takes their booking page offline', function () {
    $storefront = Storefront::factory()->create();
    Car::factory()->for($storefront->owner, 'owner')->create();

    $this->actingAs(User::factory()->admin()->create())
        ->patch(route('admin.lessors.update', $storefront->owner), ['status' => 'suspended'])
        ->assertSessionHasNoErrors();

    expect($storefront->owner->fresh()->status)->toBe(UserStatus::Suspended);
    $this->get(route('storefronts.show', $storefront))->assertNotFound();
});

test('an admin account cannot be managed as a lessor', function () {
    $otherAdmin = User::factory()->admin()->create();

    $this->actingAs(User::factory()->admin()->create())
        ->patch(route('admin.lessors.update', $otherAdmin), ['status' => 'suspended'])
        ->assertNotFound();

    expect($otherAdmin->fresh()->status)->toBe(UserStatus::Active);
});

test('the lessor list searches by name or email and excludes admins', function () {
    $match = User::factory()->create(['name' => 'Maria Santos']);
    User::factory()->create(['name' => 'Pedro Reyes']);
    $admin = User::factory()->admin()->create(['name' => 'Maria Admin']);

    $this->actingAs($admin)
        ->get(route('admin.lessors.index', ['search' => 'maria']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('lessors.data', 1)
            ->where('lessors.data.0.id', $match->id));
});
