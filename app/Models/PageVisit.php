<?php

namespace App\Models;

use Database\Factories\PageVisitFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\MassPrunable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * One view of a public page, counted without cookies. Visitors are a hash of
 * their IP, browser and the day, so the same person counts once a day and
 * can't be recognised or followed across days.
 *
 * @property int $id
 * @property string $page One of the PAGES keys.
 * @property int|null $storefront_id
 * @property int|null $car_id
 * @property string $visitor
 * @property string|null $source Where they came from, e.g. facebook.com; null when typed in or unknown.
 * @property Carbon $created_at
 */
#[Fillable(['page', 'storefront_id', 'car_id', 'visitor', 'source', 'created_at'])]
class PageVisit extends Model
{
    /** @use HasFactory<PageVisitFactory> */
    use HasFactory, MassPrunable;

    public const UPDATED_AT = null;

    /**
     * The public pages that are counted, by route name.
     *
     * @var array<string, string>
     */
    public const PAGES = [
        'home' => 'home',
        'rent' => 'directory',
        'register' => 'register',
        'storefronts.show' => 'storefront',
        'storefronts.cars.show' => 'car',
    ];

    /**
     * How long visits are kept, in months.
     */
    public const KEEP_MONTHS = 13;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
        ];
    }

    /**
     * The day's anonymous visitor ID for this request.
     */
    public static function visitorFor(Request $request): string
    {
        return substr(hash_hmac('sha256', $request->ip().'|'.$request->userAgent().'|'.today()->toDateString(), (string) config('app.key')), 0, 16);
    }

    /**
     * The site the visitor came from, with mobile and link-shim prefixes
     * dropped so m.facebook.com and l.facebook.com both read facebook.com.
     * Null for direct visits and links within Rentiva.
     */
    public static function sourceFor(Request $request): ?string
    {
        $host = parse_url((string) $request->headers->get('referer'), PHP_URL_HOST);

        if (! is_string($host) || $host === '' || $host === $request->getHost()) {
            return null;
        }

        return Str::limit((string) preg_replace('/^(www|m|l|lm|mobile)\./', '', Str::lower($host)), 60, '');
    }

    /**
     * @return BelongsTo<Storefront, $this>
     */
    public function storefront(): BelongsTo
    {
        return $this->belongsTo(Storefront::class);
    }

    /**
     * @return BelongsTo<Car, $this>
     */
    public function car(): BelongsTo
    {
        return $this->belongsTo(Car::class);
    }

    /**
     * Visits older than KEEP_MONTHS are deleted by model:prune.
     *
     * @return Builder<self>
     */
    public function prunable(): Builder
    {
        return static::where('created_at', '<', now()->subMonths(self::KEEP_MONTHS));
    }
}
