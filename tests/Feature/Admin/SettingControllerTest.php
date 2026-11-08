<?php

use App\Models\Booking;
use App\Models\Car;
use App\Models\Setting;
use App\Models\Storefront;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('an admin sets the platform\'s retention periods', function () {
    $this->actingAs(User::factory()->admin()->create())
        ->put(route('admin.settings.update'), ['data_retention_months' => 36, 'proof_retention_days' => 14])
        ->assertRedirect(route('admin.settings.edit'));

    expect(Setting::get(Setting::DataRetentionMonths))->toBe(36)
        ->and(Setting::get(Setting::ProofRetentionDays))->toBe(14);

    $this->get(route('admin.settings.edit'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/settings')
            ->where('settings.data_retention_months', 36)
            ->where('settings.proof_retention_days', 14));
});

test('retention periods are validated', function () {
    $this->actingAs(User::factory()->admin()->create())
        ->put(route('admin.settings.update'), ['data_retention_months' => 500, 'proof_retention_days' => 0])
        ->assertSessionHasErrors(['data_retention_months', 'proof_retention_days']);
});

test('owners cannot change platform settings', function () {
    $storefront = Storefront::factory()->create();

    $this->actingAs($storefront->owner)
        ->put(route('admin.settings.update'), ['data_retention_months' => 120, 'proof_retention_days' => 365])
        ->assertForbidden();
});

test('an admin gives one owner their own periods, and clears them back to the platform\'s', function () {
    $storefront = Storefront::factory()->create();
    $this->actingAs(User::factory()->admin()->create());

    $this->put(route('admin.lessors.retention.update', $storefront->owner), ['data_retention_months' => 6, 'proof_retention_days' => ''])
        ->assertSessionHasNoErrors();

    expect($storefront->fresh())
        ->dataRetentionMonths()->toBe(6)
        ->proofRetentionDays()->toBe(30);

    $this->put(route('admin.lessors.retention.update', $storefront->owner), ['data_retention_months' => '', 'proof_retention_days' => '']);

    expect($storefront->fresh())->data_retention_months->toBeNull()->dataRetentionMonths()->toBe(24);
});

test('renter details follow the platform\'s period when the owner has none of their own', function () {
    Setting::put(Setting::DataRetentionMonths, 6);
    $car = Car::factory()->for(Storefront::factory()->create()->owner, 'owner')->create();
    $booking = Booking::factory()->for($car)->completed()->create([
        'start_date' => now()->subMonths(8),
        'end_date' => now()->subMonths(7),
        'renter_name' => 'Juan Dela Cruz',
    ]);

    $this->artisan('bookings:anonymize')->assertSuccessful();

    expect($booking->fresh()->renter_name)->toBe('Removed');
});
