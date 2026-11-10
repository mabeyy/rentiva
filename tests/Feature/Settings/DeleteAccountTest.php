<?php

use App\Models\Booking;
use App\Models\Car;
use App\Models\CarImage;
use App\Models\Invoice;
use App\Models\PaymentAccount;
use App\Models\Storefront;
use App\Models\TeamMember;
use App\Models\User;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('public');
    Storage::fake('local');
    $this->storefront = Storefront::factory()->create(['name' => 'ABQ Car Rental', 'logo_path' => 'storefronts/logo.png']);
    $this->owner = $this->storefront->owner;
    $this->car = Car::factory()->for($this->owner, 'owner')->create();
});

test('an owner can\'t delete their account while a renter is counting on an upcoming booking', function () {
    Booking::factory()->for($this->car)->confirmed()->between(today()->addDays(3)->toDateString(), today()->addDays(5)->toDateString())->create();

    $this->actingAs($this->owner)
        ->delete(route('profile.destroy'), ['password' => 'password'])
        ->assertSessionHasErrors(['password' => 'You have 1 upcoming booking. Cancel it first, so the renter knows.']);

    expect($this->owner->fresh())->not->toBeNull();
});

test('an owner can\'t delete their account with an unpaid Rentiva invoice', function () {
    Invoice::factory()->for($this->owner, 'owner')->create();

    $this->actingAs($this->owner)
        ->delete(route('profile.destroy'), ['password' => 'password'])
        ->assertSessionHasErrors('password');

    expect($this->owner->fresh())->not->toBeNull();
});

test('deleting an account removes its uploads and staff, and keeps paid invoices under the business name', function () {
    $files = [
        'public' => ['storefronts/logo.png', 'cars/photo.jpg', 'payment-qr/gcash.png'],
        'local' => ['licenses/license.jpg', 'payment-proofs/proof.jpg', 'invoice-proofs/invoice.jpg'],
    ];
    foreach ($files as $disk => $paths) {
        foreach ($paths as $path) {
            Storage::disk($disk)->put($path, 'file');
        }
    }
    CarImage::factory()->for($this->car)->create(['path' => 'cars/photo.jpg']);
    PaymentAccount::factory()->for($this->storefront)->create()->forceFill(['qr_path' => 'payment-qr/gcash.png'])->save();
    Booking::factory()->for($this->car)->completed()->create(['license_photo_path' => 'licenses/license.jpg', 'payment_proof_path' => 'payment-proofs/proof.jpg']);
    $invoice = Invoice::factory()->for($this->owner, 'owner')->create(['status' => 'paid', 'paid_at' => now()]);
    $invoice->forceFill(['proof_path' => 'invoice-proofs/invoice.jpg'])->save();
    $staff = TeamMember::factory()->for($this->owner, 'owner')->create()->user;

    $this->actingAs($this->owner)
        ->delete(route('profile.destroy'), ['password' => 'password'])
        ->assertSessionHasNoErrors()
        ->assertRedirect('/');

    expect(User::find($this->owner->id))->toBeNull()
        ->and(User::find($staff->id))->toBeNull()
        ->and(Car::count())->toBe(0)
        ->and($invoice->fresh())->owner_id->toBeNull()->billed_to->toBe('ABQ Car Rental')->proof_path->toBeNull();
    foreach ($files as $disk => $paths) {
        foreach ($paths as $path) {
            Storage::disk($disk)->assertMissing($path);
        }
    }

    $this->actingAs(User::factory()->admin()->create())
        ->get(route('admin.billing.index'))
        ->assertOk();
});
