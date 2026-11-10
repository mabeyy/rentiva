<?php

use App\Models\Booking;
use App\Models\BookingInspection;
use App\Models\NotificationLog;
use App\Models\RenterFlag;
use App\Models\Storefront;
use App\Models\User;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('local');
});

test('anonymizing an old booking also removes inspection photos, owner notes, delivery records and renter flags', function () {
    $booking = Booking::factory()->completed()->between(today()->subYears(3)->toDateString(), today()->subYears(3)->addDays(2)->toDateString())->create([
        'cancel_reason' => null,
        'deposit_note' => 'Scratch on the bumper, kept 500.',
    ]);
    $booking->forceFill(['change_request' => ['start_date' => '2023-01-01', 'end_date' => '2023-01-03', 'note' => 'My wedding', 'requested_at' => now()->toIso8601String()]])->save();
    Storage::disk('local')->put('inspections/front.jpg', 'photo');
    BookingInspection::factory()->for($booking)->create(['photos' => ['inspections/front.jpg'], 'notes' => 'Juan returned it muddy']);
    NotificationLog::record($booking, 'sms', '09171234567', 'Hi Juan, your booking is confirmed', true, storefront: null);
    $flag = RenterFlag::factory()->for($booking->car->owner, 'owner')->create();
    $flag->forceFill(['updated_at' => now()->subYears(3)])->saveQuietly();

    $this->artisan('bookings:anonymize')->assertSuccessful();

    expect($booking->fresh())->renter_name->toBe('Removed')->change_request->toBeNull()->deposit_note->toBeNull()
        ->and($booking->inspections()->sole())->photos->toBeNull()->notes->toBeNull()
        ->and(NotificationLog::sole())->recipient->toBe('Removed')->summary->toBe('Removed')
        ->and(RenterFlag::count())->toBe(0);
    Storage::disk('local')->assertMissing('inspections/front.jpg');
});

test('a transfer screenshot on a cancelled booking is deleted on schedule, unless it still needs checking', function () {
    Storage::disk('local')->put('payment-proofs/checked.jpg', 'photo');
    Storage::disk('local')->put('payment-proofs/waiting.jpg', 'photo');
    $dates = [today()->subDays(60)->toDateString(), today()->subDays(58)->toDateString()];
    $checked = Booking::factory()->cancelled()->between(...$dates)->create();
    $checked->forceFill(['payment_proof_path' => 'payment-proofs/checked.jpg', 'payment_status' => 'rejected'])->save();
    $waiting = Booking::factory()->cancelled()->between(...$dates)->create();
    $waiting->forceFill(['payment_proof_path' => 'payment-proofs/waiting.jpg', 'payment_status' => 'submitted'])->save();

    $this->artisan('payments:prune-proofs')->assertSuccessful();

    expect($checked->fresh()->payment_proof_path)->toBeNull()
        ->and($waiting->fresh()->payment_proof_path)->toBe('payment-proofs/waiting.jpg');
    Storage::disk('local')->assertMissing('payment-proofs/checked.jpg');
    Storage::disk('local')->assertExists('payment-proofs/waiting.jpg');
});

test('delivery records older than 90 days are pruned', function () {
    NotificationLog::record(null, 'mail', 'juan@example.com', 'Booking confirmed', true);
    NotificationLog::query()->update(['created_at' => now()->subDays(91)]);
    NotificationLog::record(null, 'mail', 'maria@example.com', 'Booking confirmed', true);

    $this->artisan('model:prune', ['--model' => [NotificationLog::class]]);

    expect(NotificationLog::pluck('recipient')->all())->toBe(['maria@example.com']);
});

test('deleting an owner account also deletes their delivery records', function () {
    $storefront = Storefront::factory()->create();
    NotificationLog::record(null, 'sms', '09171234567', 'Your booking is confirmed', true, storefront: $storefront);

    $this->actingAs($storefront->owner)->delete(route('profile.destroy'), ['password' => 'password'])->assertSessionHasNoErrors();

    expect(User::find($storefront->owner_id))->toBeNull()->and(NotificationLog::count())->toBe(0);
});

test('the business privacy page shows the business\'s contact email, not the owner\'s login', function () {
    $storefront = Storefront::factory()->create(['notification_email' => 'bookings@abq.ph']);

    $this->get(route('storefronts.privacy', $storefront))
        ->assertInertia(fn ($page) => $page->where('privacy.ownerEmail', 'bookings@abq.ph'));
});
