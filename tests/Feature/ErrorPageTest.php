<?php

use App\Models\Storefront;

test('a missing page shows the Rentiva error page with a way back', function () {
    $this->get('/this-page-does-not-exist-anywhere')
        ->assertNotFound()
        ->assertInertia(fn ($page) => $page->component('error')->where('status', 404));
});

test('a forbidden page shows the Rentiva error page', function () {
    $this->actingAs(Storefront::factory()->create()->owner)
        ->get(route('admin.dashboard'))
        ->assertForbidden()
        ->assertInertia(fn ($page) => $page->component('error')->where('status', 403));
});
