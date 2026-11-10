<?php

namespace App\Actions\Images;

use GdImage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Stores an uploaded photo shrunk to a sensible size and re-encoded as WebP,
 * so a 5 MB phone photo becomes a few hundred KB and pages load fast on
 * mobile data. Phone photos are turned upright using their EXIF rotation.
 * Anything GD can't read is stored as uploaded.
 */
class StoreOptimizedImage
{
    /**
     * Longest side for car photos and inspection photos.
     */
    public const int PHOTO = 1600;

    /**
     * Longest side for receipts and IDs, kept larger so small print stays legible.
     */
    public const int DOCUMENT = 2000;

    /**
     * Longest side for logos.
     */
    public const int LOGO = 512;

    /**
     * Store the image in the directory and return its path.
     */
    public function handle(UploadedFile $file, string $directory, string $disk, int $maxSide = self::PHOTO, int $quality = 80): string
    {
        // A 12-megapixel photo needs ~50 MB once decoded, more than the
        // default limit leaves room for.
        $this->ensureMemory('512M');

        $image = $this->read($file, $maxSide);

        if ($image === null) {
            return $this->storeOriginal($file, $directory, $disk);
        }

        ob_start();
        $encoded = imagewebp($image, null, $quality);
        $contents = (string) ob_get_clean();

        if (! $encoded || $contents === '') {
            return $this->storeOriginal($file, $directory, $disk);
        }

        $path = trim($directory, '/').'/'.Str::random(40).'.webp';

        if (! Storage::disk($disk)->put($path, $contents)) {
            throw new RuntimeException('The image could not be stored.');
        }

        return $path;
    }

    /**
     * Open the upload with GD, shrunk and upright, or null when GD can't
     * read it. Shrinking comes first so rotation works on the small copy.
     */
    private function read(UploadedFile $file, int $maxSide): ?GdImage
    {
        $path = $file->getRealPath();
        $type = $path ? @exif_imagetype($path) : false;

        $image = match ($type) {
            IMAGETYPE_JPEG => @imagecreatefromjpeg($path),
            IMAGETYPE_PNG => @imagecreatefrompng($path),
            IMAGETYPE_WEBP => @imagecreatefromwebp($path),
            default => false,
        };

        if (! $image instanceof GdImage) {
            return null;
        }

        $image = $this->resized($image, $maxSide);

        if ($type === IMAGETYPE_JPEG) {
            $exif = @exif_read_data($path);
            $image = $this->upright($image, is_array($exif) ? (int) ($exif['Orientation'] ?? 1) : 1);
        }

        imagepalettetotruecolor($image);
        imagealphablending($image, false);
        imagesavealpha($image, true);

        return $image;
    }

    /**
     * Undo the camera's rotation, since WebP drops the EXIF flag that told
     * browsers to rotate it.
     */
    private function upright(GdImage $image, int $orientation): GdImage
    {
        $angle = match ($orientation) {
            3 => 180,
            6 => -90,
            8 => 90,
            default => 0,
        };

        return $angle === 0 ? $image : (imagerotate($image, $angle, 0) ?: $image);
    }

    /**
     * Scale down so the longest side fits, never up.
     */
    private function resized(GdImage $image, int $maxSide): GdImage
    {
        $width = imagesx($image);
        $height = imagesy($image);
        $scale = $maxSide / max($width, $height);

        if ($scale >= 1) {
            return $image;
        }

        $scaled = imagescale($image, max(1, (int) round($width * $scale)), max(1, (int) round($height * $scale)), IMG_BICUBIC);

        if ($scaled === false) {
            return $image;
        }

        unset($image);

        return $scaled;
    }

    /**
     * Raise the memory limit for this request if it's lower than needed.
     */
    private function ensureMemory(string $limit): void
    {
        $current = ini_get('memory_limit');

        if ($current !== '-1' && $this->bytes($current) < $this->bytes($limit)) {
            ini_set('memory_limit', $limit);
        }
    }

    /**
     * "512M" → bytes.
     */
    private function bytes(string $size): int
    {
        $number = (int) $size;

        return match (strtoupper(substr(trim($size), -1))) {
            'G' => $number * 1024 ** 3,
            'M' => $number * 1024 ** 2,
            'K' => $number * 1024,
            default => $number,
        };
    }

    private function storeOriginal(UploadedFile $file, string $directory, string $disk): string
    {
        return $file->store($directory, $disk) ?: throw new RuntimeException('The image could not be stored.');
    }
}
