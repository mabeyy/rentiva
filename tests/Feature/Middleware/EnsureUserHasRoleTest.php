<?php

use App\Models\User;

test('a lessor is forbidden from the admin area', function () {
    $this->actingAs(User::factory()->create())
        ->get(route('admin.dashboard'))
        ->assertForbidden();
});

test('an admin is forbidden from the lessor area', function () {
    $this->actingAs(User::factory()->admin()->create())
        ->get(route('lessor.dashboard'))
        ->assertForbidden();
});

test('guests are redirected to log in from the admin area', function () {
    $this->get(route('admin.dashboard'))->assertRedirect(route('login'));
});
