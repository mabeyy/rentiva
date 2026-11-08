<?php

use App\Models\Car;
use App\Models\Setting;
use App\Models\Storefront;
use Inertia\Testing\AssertableInertia as Assert;

test('the platform privacy notice is public and shows the platform\'s retention periods', function () {
    Setting::put(Setting::DataRetentionMonths, 18);

    $this->get(route('privacy'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('privacy')
            ->has('lastUpdated')
            ->where('retentionMonths', 18)
            ->where('proofRetentionDays', 30));
});

test('an owner\'s privacy notice shows the retention periods the admin set for them', function () {
    $storefront = Storefront::factory()->create(['data_retention_months' => 12, 'proof_retention_days' => 45, 'accepts_bank_transfer' => true]);
    Car::factory()->for($storefront->owner, 'owner')->create();

    $this->get(route('storefronts.privacy', $storefront))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('storefront/privacy')
            ->where('privacy.retentionMonths', 12)
            ->where('privacy.proofRetentionDays', 45)
            ->where('privacy.acceptsBankTransfer', true));
});

test('privacy cannot be taken as a booking page address', function () {
    expect(Storefront::isReservedSlug('privacy'))->toBeTrue();
});
