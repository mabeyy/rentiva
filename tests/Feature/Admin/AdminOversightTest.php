<?php

use App\Models\AdminAction;
use App\Models\Plan;
use App\Models\Storefront;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('admin changes are kept in the admin log', function () {
    $admin = User::factory()->admin()->create(['name' => 'Ana Admin']);
    $owner = Storefront::factory()->create(['name' => 'ABQ Car Rental'])->owner;
    $plan = Plan::factory()->create(['name' => 'Growth']);
    $this->actingAs($admin);

    $this->put(route('admin.lessors.subscription.update', $owner), ['plan_id' => $plan->id]);
    $this->put(route('admin.lessors.update', $owner), ['status' => 'suspended']);

    $this->get(route('admin.log'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/log')
            ->where('actions.data.0.action', 'Suspended an owner')
            ->where('actions.data.0.subject', 'ABQ Car Rental')
            ->where('actions.data.1.details', 'Growth')
            ->where('actions.data.1.admin_name', 'Ana Admin'));
});

test('viewing as an owner is logged, and billing and team changes are off while doing it', function () {
    $owner = Storefront::factory()->onPlan()->create()->owner;
    $this->actingAs(User::factory()->admin()->create())->post(route('admin.lessors.impersonate', $owner));

    expect(AdminAction::where('action', 'impersonation_started')->exists())->toBeTrue();

    $this->delete(route('lessor.billing.cancel'))->assertRedirect();
    $this->post(route('lessor.team.store'), ['name' => 'Staff', 'email' => 'staff@example.com', 'permissions' => ['bookings']]);

    expect($owner->subscription->fresh()->cancelled_at)->toBeNull()
        ->and($owner->team()->count())->toBe(0);
});

test('sign-ups are limited per visitor', function () {
    foreach (range(1, 6) as $attempt) {
        $this->post('/register', ['name' => 'x'])->assertStatus(302);
    }

    $this->post('/register', ['name' => 'x'])->assertTooManyRequests();
});
