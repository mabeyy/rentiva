<?php

use App\Actions\Bookings\PriceBooking;
use App\Models\Booking;
use App\Models\Car;
use App\Models\Invoice;
use App\Models\PeakSeason;
use App\Models\PickupLocation;
use App\Models\Plan;
use App\Models\Setting;
use App\Models\Storefront;
use App\Models\Subscription;
use App\Models\TeamMember;
use App\Models\User;
use App\Notifications\BookingActivity;
use App\Notifications\BookingReceived;
use App\Notifications\BookingRequested;
use App\Notifications\InvoiceIssued;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->owner = Storefront::factory()->create()->owner;
    $this->plan = Plan::factory()->create(['name' => 'Starter', 'price' => 49900, 'max_cars' => 2]);
});

test('picking a first plan invoices the first month right away; switching doesn\'t', function () {
    Notification::fake();
    $this->actingAs($this->owner)
        ->get(route('lessor.billing.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('subscription.plan_id', null)
            ->missing('subscription.on_trial')
            ->has('plans', 1));

    $this->put(route('lessor.billing.update'), ['plan_id' => $this->plan->id])->assertSessionHasNoErrors();

    $invoice = $this->owner->invoices()->sole();
    expect($this->owner->subscription->fresh()->plan_id)->toBe($this->plan->id)
        ->and($invoice)->amount->toBe(49900)->period_start->toDateString()->toBe(today()->toDateString());
    Notification::assertSentTo($this->owner, InvoiceIssued::class);

    $bigger = Plan::factory()->create(['price' => 129900, 'max_cars' => null]);
    $this->put(route('lessor.billing.update'), ['plan_id' => $bigger->id])->assertSessionHasNoErrors();
    expect($this->owner->invoices()->count())->toBe(1);
});

test('a plan can\'t be picked with more cars than it allows, and adding cars stops at the limit', function () {
    Car::factory()->count(3)->for($this->owner, 'owner')->create();
    $this->actingAs($this->owner);

    $this->put(route('lessor.billing.update'), ['plan_id' => $this->plan->id])->assertSessionHasErrors('plan_id');

    $roomy = Plan::factory()->create(['max_cars' => 3]);
    $this->put(route('lessor.billing.update'), ['plan_id' => $roomy->id])->assertSessionHasNoErrors();
    $this->post(route('lessor.cars.store'), ['make' => 'Toyota'])->assertSessionHasErrors(['make' => 'Your plan allows 3 cars. Upgrade under Billing to add more.']);
});

test('the daily run invoices owners with a plan, once per month', function () {
    Notification::fake();
    $subscription = Subscription::factory()->for($this->owner, 'owner')->for($this->plan)->create();

    $this->artisan('billing:issue-invoices')->assertSuccessful();
    $this->artisan('billing:issue-invoices')->assertSuccessful();

    $invoice = $this->owner->invoices()->sole();
    expect($invoice)
        ->amount->toBe(49900)
        ->period_start->toDateString()->toBe(today()->toDateString())
        ->period_end->toDateString()->toBe(today()->addMonthNoOverflow()->subDay()->toDateString())
        ->and($subscription->fresh()->current_period_end->toDateString())->toBe($invoice->period_end->toDateString());
    Notification::assertSentTo($this->owner, InvoiceIssued::class);

    $this->travelTo($invoice->period_end->addDay());
    $this->artisan('billing:issue-invoices');
    expect($this->owner->invoices()->count())->toBe(2);
});

test('owners without a plan, or already invoiced for this month, aren\'t invoiced', function () {
    Subscription::factory()->for($this->owner, 'owner')->for($this->plan)->create(['current_period_end' => today()->addDays(5)->toDateString()]);
    Subscription::factory()->for(User::factory(), 'owner')->create(['plan_id' => null]);

    $this->artisan('billing:issue-invoices');

    expect(Invoice::count())->toBe(0);
});

test('an owner pays an invoice and an admin marks it paid or sends it back', function () {
    Storage::fake('local');
    Setting::put(Setting::PlatformBankAccounts, [['bank_name' => 'BDO', 'account_name' => 'Rentiva Inc.', 'account_number' => '0012-3456']]);
    $invoice = Invoice::factory()->for($this->owner, 'owner')->create();

    $this->actingAs($this->owner)->post(route('lessor.billing.invoices.pay', $invoice), [
        'payment_reference' => 'BDO-998877',
        'proof' => UploadedFile::fake()->image('receipt.jpg'),
    ])->assertSessionHasNoErrors();
    expect($invoice->fresh()->status)->toBe('submitted');

    $admin = User::factory()->admin()->create();
    $this->actingAs($admin)->get(route('admin.billing.invoices.proof', $invoice))->assertOk();
    $this->put(route('admin.billing.invoices.review', $invoice), ['decision' => 'rejected', 'reason' => 'Amount is short'])->assertSessionHasNoErrors();
    expect($invoice->fresh())->status->toBe('rejected')->rejection_reason->toBe('Amount is short');

    $this->put(route('admin.billing.invoices.review', $invoice), ['decision' => 'paid']);
    expect($invoice->fresh())->status->toBe('paid')->paid_at->not->toBeNull();
});

test('owners can\'t pay someone else\'s invoice, and only admins manage plans', function () {
    $invoice = Invoice::factory()->create();

    $this->actingAs($this->owner)->post(route('lessor.billing.invoices.pay', $invoice), ['payment_reference' => 'x'])->assertForbidden();
    $this->post(route('admin.plans.store'), ['name' => 'Free', 'price' => 0])->assertForbidden();

    $this->actingAs(User::factory()->admin()->create())
        ->post(route('admin.plans.store'), ['name' => 'Fleet Unlimited', 'price' => 3999, 'max_cars' => '', 'max_staff' => '', 'is_active' => '1', 'features' => ['sms', 'calendar_sync']])
        ->assertSessionHasNoErrors();
    expect(Plan::where('name', 'Fleet Unlimited')->sole())
        ->price->toBe(399900)
        ->max_cars->toBeNull()
        ->features->toBe(['sms', 'calendar_sync']);
});

test('admins set where owners pay', function () {
    $this->actingAs(User::factory()->admin()->create())
        ->put(route('admin.billing.accounts.update'), ['accounts' => [['bank_name' => 'GCash', 'account_name' => 'Rentiva', 'account_number' => '0917']]])
        ->assertSessionHasNoErrors();

    expect(Setting::get(Setting::PlatformBankAccounts))->toBe([['bank_name' => 'GCash', 'account_name' => 'Rentiva', 'account_number' => '0917']]);
});

test('the admin plans and billing pages open', function () {
    Invoice::factory()->for($this->owner, 'owner')->create(['status' => 'submitted']);
    $this->actingAs(User::factory()->admin()->create());

    $this->get(route('admin.plans.index'))->assertOk()->assertInertia(fn (Assert $page) => $page->component('admin/plans')->has('plans', 2));
    $this->get(route('admin.billing.index'))->assertOk()->assertInertia(fn (Assert $page) => $page
        ->component('admin/billing')
        ->has('invoices.data', 1)
        ->has('invoices.meta.last_page')
        ->where('counts.submitted', 1));
});

test('a booking page stops taking online bookings once an invoice is past the grace period', function () {
    Notification::fake();
    Setting::put(Setting::BillingGraceDays, 7);
    Subscription::for($this->owner)->update(['plan_id' => $this->plan->id]);
    $car = Car::factory()->for($this->owner, 'owner')->create();
    $invoice = Invoice::factory()->for($this->owner, 'owner')->create(['due_on' => today()->subDays(5)->toDateString()]);
    $request = [
        'start_date' => today()->addDays(10)->toDateString(),
        'end_date' => today()->addDays(12)->toDateString(),
        'renter_name' => 'Juan Dela Cruz',
        'renter_email' => 'juan@example.com',
        'renter_phone' => '09171234567',
        'renter_license_number' => 'N01',
        'accepted_terms' => '1',
    ];

    // Overdue, but still within the grace period.
    $this->post(route('cars.bookings.store', $car), $request)->assertSessionHasNoErrors();

    $invoice->update(['due_on' => today()->subDays(8)->toDateString()]);
    expect($this->owner->isBillingPaused())->toBeTrue();
    $this->post(route('cars.bookings.store', $car), [...$request, 'start_date' => today()->addDays(20)->toDateString(), 'end_date' => today()->addDays(22)->toDateString()])
        ->assertSessionHasErrors('start_date');

    $this->actingAs($this->owner)
        ->get(route('lessor.dashboard'))
        ->assertInertia(fn (Assert $page) => $page->where('billing.paused', true));

    $invoice->update(['status' => 'paid']);
    expect($this->owner->isBillingPaused())->toBeFalse();
});

test('admins are notified when an owner pays, and can open the alert from their bell', function () {
    Storage::fake('local');
    $admin = User::factory()->admin()->create();
    $invoice = Invoice::factory()->for($this->owner, 'owner')->create();

    $this->actingAs($this->owner)->post(route('lessor.billing.invoices.pay', $invoice), [
        'payment_reference' => 'BDO-1',
        'proof' => UploadedFile::fake()->image('receipt.jpg'),
    ]);

    $alert = $admin->notifications()->sole();
    expect($alert->data['action'])->toBe('invoice_paid');

    $this->actingAs($admin)
        ->get(route('admin.dashboard'))
        ->assertInertia(fn (Assert $page) => $page->where('notifications.unread', 1)->where('notifications.items.0.title', 'Payment to check'));

    $this->get(route('admin.notifications.show', $alert->id))->assertRedirect();
    expect($alert->fresh()->read_at)->not->toBeNull();
});

test('admins change an owner\'s plan and set the grace period', function () {
    $this->actingAs(User::factory()->admin()->create());

    $this->put(route('admin.lessors.subscription.update', $this->owner), ['plan_id' => $this->plan->id])->assertSessionHasNoErrors();

    expect($this->owner->subscription->fresh()->plan_id)->toBe($this->plan->id);

    $this->get(route('admin.lessors.show', $this->owner))
        ->assertInertia(fn (Assert $page) => $page->where('subscription.plan_id', $this->plan->id)->has('plans'));

    $this->put(route('admin.billing.grace.update'), ['grace_days' => 21])->assertSessionHasNoErrors();
    expect(Setting::get(Setting::BillingGraceDays))->toBe(21);
});

test('the home page lists the plans owners can pick', function () {
    Plan::factory()->create(['name' => 'Hidden', 'is_active' => false]);

    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('home')
            ->has('plans', 1)
            ->where('plans.0.name', 'Starter')
            ->where('plans.0.features.0.key', 'email')
            ->has('plans.0.features', count(Plan::FEATURES))
            ->missing('trialDays'));
});

test('season pricing, down payments and exports need a plan that includes them', function () {
    $car = Car::factory()->for($this->owner, 'owner')->create(['daily_rate' => 100000]);
    PeakSeason::factory()->for($this->owner, 'owner')->create([
        'start_date' => today()->toDateString(), 'end_date' => today()->addDays(10)->toDateString(), 'rate_change' => 50,
    ]);
    Subscription::for($this->owner)->update(['plan_id' => Plan::factory()->create(['features' => []])->id]);
    $owner = $this->owner->fresh();

    expect(app(PriceBooking::class)->handle($car->fresh(), today(), today()->addDays(2))['subtotal'])->toBe(200000);

    $this->actingAs($owner);
    $this->post(route('lessor.seasons.store'), ['name' => 'Xmas', 'start_date' => '2026-12-20', 'end_date' => '2026-12-31', 'rate_change' => 20])->assertForbidden();
    $this->put(route('lessor.payments.update'), ['accepts_pay_at_pickup' => '1', 'transfer_deadline_minutes' => 60, 'down_payment_enabled' => '1', 'down_payment_percent' => 30]);
    expect($owner->storefront->fresh()->down_payment_enabled)->toBeFalse();

    Subscription::for($owner)->update(['plan_id' => Plan::factory()->create()->id]);
    $this->actingAs($owner->fresh());
    expect(app(PriceBooking::class)->handle($car->fresh(), today(), today()->addDays(2))['subtotal'])->toBe(300000);
});

test('photo checks need Growth, more pickup locations need Fleet', function () {
    Notification::fake();
    $growth = Storefront::factory()->onPlan(['features' => ['email', 'sms', 'calendar_sync', 'peak_pricing', 'down_payments']])->create();
    $car = Car::factory()->for($growth->owner, 'owner')->create();
    $booking = Booking::factory()->for($car)->confirmed()->create();
    $this->actingAs($growth->owner);

    $this->post(route('lessor.bookings.inspections.store', $booking), ['type' => 'pickup', 'fuel_level' => 8, 'odometer' => 1000])->assertForbidden();
    $this->post(route('lessor.pickup-locations.store'), ['address' => '2 Other St', 'city' => 'Cebu City'])
        ->assertSessionHasErrors(['address' => 'Your plan includes one pickup location. More locations are on the Fleet plan.']);
});

test('Starter renters still get their booking link; owner alerts and other emails need a paid plan', function () {
    Notification::fake();
    $starter = Storefront::factory()->onPlan(['features' => []])->create();
    $car = Car::factory()->for($starter->owner, 'owner')->create();

    $this->post(route('cars.bookings.store', $car), [
        'start_date' => today()->addDays(100)->toDateString(),
        'end_date' => today()->addDays(102)->toDateString(),
        'renter_name' => 'Juan Dela Cruz',
        'renter_email' => 'juan@example.com',
        'renter_phone' => '09171234567',
        'renter_license_number' => 'N01',
        'accepted_terms' => '1',
    ])->assertSessionHasNoErrors();

    Notification::assertSentOnDemand(BookingReceived::class);
    Notification::assertNotSentTo($starter->owner, BookingRequested::class);
    Notification::assertSentTo($starter->owner, BookingActivity::class);
});

test('yearly billing charges ten months for a year', function () {
    Notification::fake();
    $this->actingAs($this->owner)
        ->put(route('lessor.billing.update'), ['plan_id' => $this->plan->id, 'billing_cycle' => 'yearly'])
        ->assertSessionHasNoErrors();

    $invoice = $this->owner->invoices()->sole();
    expect($this->owner->subscription->fresh()->billing_cycle)->toBe('yearly')
        ->and($invoice)
        ->amount->toBe(49900 * 10)
        ->period_end->toDateString()->toBe(today()->addYearNoOverflow()->subDay()->toDateString());
});

test('Fleet owners lose the platform badge', function () {
    $plain = Storefront::factory()->create();
    $fleet = Storefront::factory()->onPlan()->create();

    $this->get(route('storefronts.show', $plain))->assertInertia(fn (Assert $page) => $page->where('storefront.show_platform_badge', true));
    $this->get(route('storefronts.show', $fleet))->assertInertia(fn (Assert $page) => $page->where('storefront.show_platform_badge', false));
});

test('owners can\'t downgrade below the staff or pickup locations they have', function () {
    $this->actingAs($this->owner);
    TeamMember::factory()->for($this->owner, 'owner')->create();
    PickupLocation::factory()->count(2)->for($this->owner, 'owner')->create();
    $soloPlan = Plan::factory()->create(['max_cars' => 50, 'max_staff' => 0, 'features' => ['multiple_locations']]);
    $oneLocationPlan = Plan::factory()->create(['max_cars' => 50, 'max_staff' => 5, 'features' => []]);

    $this->put(route('lessor.billing.update'), ['plan_id' => $soloPlan->id])
        ->assertSessionHasErrors(['plan_id' => "{$soloPlan->name} doesn't include staff accounts. Remove your staff under Team first, or pick a bigger plan."]);
    $this->put(route('lessor.billing.update'), ['plan_id' => $oneLocationPlan->id])
        ->assertSessionHasErrors(['plan_id' => "{$oneLocationPlan->name} includes one pickup location. Remove the others first, or pick a bigger plan."]);
});

test('owners see support contacts, and the priority line only on plans with priority support', function () {
    Setting::put(Setting::SupportEmail, 'help@rentiva.ph');
    Setting::put(Setting::PriorityPhone, '0917 000 0000');
    $this->actingAs($this->owner)
        ->get(route('lessor.help'))
        ->assertInertia(fn (Assert $page) => $page->where('support.email', 'help@rentiva.ph')->where('priority', null));

    $fleet = Storefront::factory()->onPlan()->create()->owner;
    $this->actingAs($fleet)
        ->get(route('lessor.help'))
        ->assertInertia(fn (Assert $page) => $page->where('priority.phone', '0917 000 0000')->where('priority.response_hours', 4));

    $this->actingAs(User::factory()->admin()->create())
        ->put(route('admin.settings.support.update'), ['support_email' => 'care@rentiva.ph', 'priority_response_hours' => 2])
        ->assertSessionHasNoErrors();
    expect(Setting::get(Setting::PriorityResponseHours))->toBe(2);
});

test('featured businesses get the strip above the directory, not a second spot in the list', function () {
    $featured = Storefront::factory()->onPlan()->create(['name' => 'Top Rentals']);
    Car::factory()->for($featured->owner, 'owner')->create();
    Car::factory()->for(Storefront::factory()->create()->owner, 'owner')->create();

    $this->get(route('rent'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('featured', 1)
            ->where('featured.0.name', 'Top Rentals')
            ->has('storefronts.data', 1));
});

test('the admin dashboard shows recurring revenue, owners per plan and what to collect', function () {
    $yearly = Plan::factory()->create(['name' => 'Yearly Plan', 'price' => 120000]);
    Subscription::factory()->for($this->owner, 'owner')->for($this->plan)->create();
    Subscription::factory()->for(Storefront::factory()->create()->owner, 'owner')->for($yearly)->create(['billing_cycle' => 'yearly']);
    Storefront::factory()->create();
    Invoice::factory()->for($this->owner, 'owner')->create(['amount' => 49900, 'due_on' => today()->subDay()->toDateString()]);
    Invoice::factory()->for($this->owner, 'owner')->create(['status' => 'submitted']);

    $this->actingAs(User::factory()->admin()->create())
        ->get(route('admin.dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            // ₱499 monthly + ₱12,000 a year (₱1,200 × 10) ÷ 12 = ₱499 + ₱1,000.
            ->where('subscriptions.mrr', 49900 + 100000)
            ->where('subscriptions.paying_owners', 2)
            ->where('subscriptions.owners_without_plan', 1)
            ->where('subscriptions.yearly_owners', 1)
            ->where('subscriptions.overdue_owners', 1)
            ->where('subscriptions.payments_to_check', 1)
            ->where('setup.1.key', 'accounts')
            ->where('setup.1.done', false));
});

test('the admin setup checklist disappears once everything is filled in', function () {
    Setting::put(Setting::PlatformBankAccounts, [['bank_name' => 'BDO', 'account_name' => 'Rentiva', 'account_number' => '1']]);
    Setting::put(Setting::SupportEmail, 'help@rentiva.ph');
    Setting::put(Setting::SupportPhone, '0917');
    Setting::put(Setting::PriorityPhone, '0918');

    $this->actingAs(User::factory()->admin()->create())
        ->get(route('admin.dashboard'))
        ->assertInertia(fn (Assert $page) => $page->where('setup', null));
});

test('the terms page shows the billing rules owners agree to', function () {
    Setting::put(Setting::BillingGraceDays, 10);

    $this->get(route('terms'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('terms')->where('graceDays', 10)->where('daysToPay', Invoice::DAYS_TO_PAY));
});
