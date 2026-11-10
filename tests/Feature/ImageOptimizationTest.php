<?php

use App\Actions\Images\StoreOptimizedImage;
use App\Models\Storefront;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('public');
    Storage::fake('local');
});

/**
 * The stored image's width, height and MIME type.
 *
 * @return array{0: int, 1: int, mime: string}
 */
function storedImageSize(string $disk, string $path): array
{
    return getimagesizefromstring(Storage::disk($disk)->get($path));
}

test('a logo is capped at 512px and a small one is never enlarged', function (int $uploaded, int $stored) {
    $storefront = Storefront::factory()->create();

    $this->actingAs($storefront->owner)
        ->put(route('lessor.storefront.update'), [
            'name' => $storefront->name,
            'slug' => $storefront->slug,
            'logo' => UploadedFile::fake()->image('logo.png', $uploaded, $uploaded),
        ]);

    expect(storedImageSize('public', $storefront->fresh()->logo_path)[0])->toBe($stored);
})->with([
    'large' => [2000, 512],
    'small' => [300, 300],
]);

test('a file GD can\'t read is stored as uploaded', function () {
    $path = app(StoreOptimizedImage::class)->handle(
        UploadedFile::fake()->createWithContent('scan.jpg', 'not really an image'),
        'payment-proofs',
        'local',
    );

    expect($path)->toEndWith('.jpg');
    Storage::disk('local')->assertExists($path);
});
