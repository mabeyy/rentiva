<?php

use App\Models\Car;
use App\Models\Setting;
use App\Models\Storefront;
use App\Models\User;
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

test('both privacy notices name the Data Protection Officer the admin saved', function () {
    $storefront = Storefront::factory()->create();

    $this->actingAs(User::factory()->admin()->create())
        ->put(route('admin.settings.data-protection.update'), [
            'legal_name' => 'Rentiva Technologies Inc.',
            'dpo_name' => 'Ana Reyes',
            'dpo_email' => 'dpo@rentiva.ph',
        ])
        ->assertRedirect(route('admin.settings.edit'));

    $expected = ['legalName' => 'Rentiva Technologies Inc.', 'dpoName' => 'Ana Reyes', 'dpoEmail' => 'dpo@rentiva.ph'];

    $this->get(route('privacy'))->assertInertia(fn (Assert $page) => $page->where('dataProtection', $expected));
    $this->get(route('storefronts.privacy', $storefront))->assertInertia(fn (Assert $page) => $page->where('dataProtection', $expected));
});

test('without a DPO set, the notices fall back to the support email', function () {
    Setting::put(Setting::SupportEmail, 'help@rentiva.ph');

    $this->get(route('privacy'))->assertInertia(fn (Assert $page) => $page
        ->where('dataProtection.dpoName', null)
        ->where('dataProtection.dpoEmail', 'help@rentiva.ph'));
});

test('only an admin can change the data protection details', function () {
    $this->actingAs(User::factory()->create())
        ->put(route('admin.settings.data-protection.update'), ['dpo_email' => 'me@example.com'])
        ->assertForbidden();

    expect(Setting::get(Setting::DpoEmail))->toBeNull();
});
