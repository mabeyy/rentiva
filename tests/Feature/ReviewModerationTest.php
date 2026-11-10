<?php

use App\Models\Booking;
use App\Models\Car;
use App\Models\Review;
use App\Models\Storefront;
use App\Models\User;
use App\Notifications\ReviewReported;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->storefront = Storefront::factory()->create();
    $this->owner = $this->storefront->owner;
    $car = Car::factory()->for($this->owner, 'owner')->create();
    $this->review = Review::factory()->for(Booking::factory()->for($car)->completed())->create(['rating' => 1, 'comment' => 'Call Juan at 0917 123 4567']);
    Review::factory()->for(Booking::factory()->for($car)->completed())->create(['rating' => 5]);
});

test('an owner reports a review to Rentiva with a reason, once', function () {
    Notification::fake();
    $admin = User::factory()->admin()->create();
    $this->actingAs($this->owner);

    $this->put(route('lessor.reviews.report', $this->review), ['reason' => 'Short'])->assertSessionHasErrors('reason');
    $this->put(route('lessor.reviews.report', $this->review), ['reason' => 'It shares our driver\'s phone number.'])->assertSessionHasNoErrors();

    expect($this->review->fresh())->reported_at->not->toBeNull()->report_reason->toBe('It shares our driver\'s phone number.')->hidden_at->toBeNull();
    Notification::assertSentTo($admin, ReviewReported::class);
    $this->put(route('lessor.reviews.report', $this->review), ['reason' => 'Reporting it a second time.'])->assertStatus(422);
});

test('owners can only report their own reviews, and can\'t hide them', function () {
    $this->actingAs(Storefront::factory()->create()->owner)
        ->put(route('lessor.reviews.report', $this->review), ['reason' => 'Not about my business at all.'])
        ->assertForbidden();

    $this->actingAs($this->owner)
        ->put(route('admin.reviews.update', $this->review), ['decision' => 'hide'])
        ->assertForbidden();
});

test('an admin hides a reported review from the booking page and its average, and can show it again', function () {
    $this->review->forceFill(['reported_at' => now(), 'report_reason' => 'Shares a phone number.'])->save();
    $this->actingAs(User::factory()->admin()->create());

    $this->get(route('admin.reviews.index'))
        ->assertInertia(fn (Assert $page) => $page->component('admin/reviews')->where('counts.reported', 1)->where('reviews.data.0.id', $this->review->id));

    $this->put(route('admin.reviews.update', $this->review), ['decision' => 'hide'])->assertSessionHasNoErrors();

    $this->get(route('storefronts.show', $this->storefront))
        ->assertInertia(fn (Assert $page) => $page->where('summary.reviewCount', 1)->where('summary.averageRating', 5));
    $this->actingAs($this->owner)
        ->get(route('lessor.reviews.index'))
        ->assertInertia(fn (Assert $page) => $page->where('summary.count', 1)
            ->where('reviews.data', fn ($reviews): bool => collect($reviews)->firstWhere('id', $this->review->id)['is_hidden'] === true));

    $this->actingAs(User::factory()->admin()->create())
        ->put(route('admin.reviews.update', $this->review), ['decision' => 'show']);
    expect($this->review->fresh())->hidden_at->toBeNull()->reported_at->toBeNull();
    $this->get(route('storefronts.show', $this->storefront))
        ->assertInertia(fn (Assert $page) => $page->where('summary.reviewCount', 2));
});

test('an admin keeps a fairly critical review up, dismissing the report', function () {
    $this->review->forceFill(['reported_at' => now(), 'report_reason' => 'We disagree with it.'])->save();

    $this->actingAs(User::factory()->admin()->create())
        ->put(route('admin.reviews.update', $this->review), ['decision' => 'keep'])
        ->assertSessionHasNoErrors();

    expect($this->review->fresh())->reported_at->toBeNull()->report_reason->toBeNull()->hidden_at->toBeNull();
});
