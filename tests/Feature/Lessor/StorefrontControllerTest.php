<?php

use App\Models\PickupLocation;
use App\Models\Storefront;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('a lessor customizes their booking page and uploads a logo', function () {
    Storage::fake('public');
    $storefront = Storefront::factory()->create();

    $mainLocation = PickupLocation::factory()->for($storefront->owner, 'owner')->create(['city' => 'Cagayan De Oro City']);

    $this->actingAs($storefront->owner)->put(route('lessor.storefront.update'), [
        'name' => 'ABQ Car Rental',
        'slug' => 'ABQ Car Rental',
        'main_pickup_location_id' => $mainLocation->id,
        'phone' => '09171234567',
        'logo' => UploadedFile::fake()->image('logo.png'),
    ])->assertRedirect(route('lessor.storefront.edit'));

    expect($storefront->fresh())
        ->name->toBe('ABQ Car Rental')
        ->slug->toBe('abq-car-rental')
        ->city->toBe('Cagayan De Oro City');
    Storage::disk('public')->assertExists($storefront->fresh()->logo_path);
});

test('a lessor without a booking page can create one', function () {
    $lessor = User::factory()->create();

    $this->actingAs($lessor)->put(route('lessor.storefront.update'), [
        'name' => 'Santos Rentals',
        'slug' => 'santos-rentals',
    ]);

    expect($lessor->storefront()->sole()->slug)->toBe('santos-rentals');
});

test('a booking page address already used by another lessor is rejected', function () {
    Storefront::factory()->create(['slug' => 'abqcarrental']);
    $storefront = Storefront::factory()->create();

    $this->actingAs($storefront->owner)
        ->put(route('lessor.storefront.update'), ['name' => 'Copycat', 'slug' => 'abqcarrental'])
        ->assertSessionHasErrors(['slug' => 'That booking page address is already taken.']);
});

test('a lessor may keep their own booking page address', function () {
    $storefront = Storefront::factory()->create(['slug' => 'abqcarrental']);

    $this->actingAs($storefront->owner)
        ->put(route('lessor.storefront.update'), ['name' => 'ABQ', 'slug' => 'abqcarrental'])
        ->assertSessionHasNoErrors();
});

test('a suspended lessor cannot change their booking page', function () {
    $storefront = Storefront::factory()->for(User::factory()->suspended(), 'owner')->create();

    $this->actingAs($storefront->owner)
        ->put(route('lessor.storefront.update'), ['name' => 'New name', 'slug' => 'new-name'])
        ->assertForbidden();
});

test('a lessor cannot take an address the app uses for its own pages', function (string $slug) {
    $storefront = Storefront::factory()->create();

    $this->actingAs($storefront->owner)
        ->put(route('lessor.storefront.update'), ['name' => 'Rentals', 'slug' => $slug])
        ->assertSessionHasErrors(['slug' => 'That address is reserved. Please choose another.']);
})->with(['cars', 'login', 'admin', 'dashboard']);

test('a lessor leaves the renter directory and rejoins it', function () {
    $storefront = Storefront::factory()->create();
    $payload = ['name' => $storefront->name, 'slug' => $storefront->slug];

    $this->actingAs($storefront->owner)->put(route('lessor.storefront.update'), $payload);
    expect($storefront->fresh()->listed_in_directory)->toBeFalse();

    $this->put(route('lessor.storefront.update'), [...$payload, 'listed_in_directory' => '1']);
    expect($storefront->fresh()->listed_in_directory)->toBeTrue();
});

test('a lessor sets their brand color and social links', function () {
    $storefront = Storefront::factory()->create();

    $this->actingAs($storefront->owner)->put(route('lessor.storefront.update'), [
        'name' => $storefront->name,
        'slug' => $storefront->slug,
        'brand_color' => '#1D4ED8',
        'facebook_url' => 'https://www.facebook.com/abqcarrental',
        'instagram_url' => 'https://instagram.com/abqcarrental',
        'tiktok_url' => 'https://www.tiktok.com/@abqcarrental',
    ])->assertSessionHasNoErrors();

    expect($storefront->fresh())
        ->brand_color->toBe('#1D4ED8')
        ->facebook_url->toBe('https://www.facebook.com/abqcarrental')
        ->instagram_url->toBe('https://instagram.com/abqcarrental')
        ->tiktok_url->toBe('https://www.tiktok.com/@abqcarrental');
});

test('a social link must point to that network', function (string $field, string $url) {
    $storefront = Storefront::factory()->create();

    $this->actingAs($storefront->owner)
        ->put(route('lessor.storefront.update'), [
            'name' => $storefront->name,
            'slug' => $storefront->slug,
            $field => $url,
        ])
        ->assertSessionHasErrors($field);
})->with([
    'facebook to another site' => ['facebook_url', 'https://example.com/abq'],
    'instagram to facebook' => ['instagram_url', 'https://facebook.com/abq'],
    'tiktok over http' => ['tiktok_url', 'http://tiktok.com/@abq'],
]);

test('a brand color must be a six-digit hex color', function (string $color) {
    $storefront = Storefront::factory()->create();

    $this->actingAs($storefront->owner)
        ->put(route('lessor.storefront.update'), [
            'name' => $storefront->name,
            'slug' => $storefront->slug,
            'brand_color' => $color,
        ])
        ->assertSessionHasErrors(['brand_color' => 'Choose a color like #E8622A.']);
})->with(['red', '#FFF', '#12345G', 'url(javascript:alert(1))']);

test('the storefront city follows the main pickup location', function () {
    $storefront = Storefront::factory()->create(['city' => null]);
    $cebu = PickupLocation::factory()->for($storefront->owner, 'owner')->create(['city' => 'Cebu City']);
    $mactan = PickupLocation::factory()->for($storefront->owner, 'owner')->create(['city' => 'Lapu-Lapu City']);

    expect($storefront->fresh())
        ->main_pickup_location_id->toBe($cebu->id)
        ->city->toBe('Cebu City');

    $this->actingAs($storefront->owner)->put(route('lessor.storefront.update'), [
        'name' => $storefront->name,
        'slug' => $storefront->slug,
        'main_pickup_location_id' => $mactan->id,
    ])->assertSessionHasNoErrors();
    expect($storefront->fresh()->city)->toBe('Lapu-Lapu City');

    $mactan->update(['city' => 'Mandaue City']);
    expect($storefront->fresh()->city)->toBe('Mandaue City');
});

test('a lessor cannot pick another lessor\'s pickup location as main', function () {
    $storefront = Storefront::factory()->create();

    $this->actingAs($storefront->owner)
        ->put(route('lessor.storefront.update'), [
            'name' => $storefront->name,
            'slug' => $storefront->slug,
            'main_pickup_location_id' => PickupLocation::factory()->create()->id,
        ])
        ->assertSessionHasErrors('main_pickup_location_id');
});
