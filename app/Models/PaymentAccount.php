<?php

namespace App\Models;

use Database\Factories\PaymentAccountFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

/**
 * A bank or e-wallet account an owner accepts transfers into (up to three).
 *
 * @property int $id
 * @property int $storefront_id
 * @property string $bank_name e.g. "BDO" or "GCash".
 * @property string $account_name
 * @property string $account_number
 * @property string|null $qr_path
 * @property-read string|null $qr_url
 * @property int $position
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['bank_name', 'account_name', 'account_number', 'position'])]
class PaymentAccount extends Model
{
    /** @use HasFactory<PaymentAccountFactory> */
    use HasFactory;

    /** Most accounts an owner may list for bank transfers. */
    public const int MAX_PER_STOREFRONT = 3;

    /**
     * @return BelongsTo<Storefront, $this>
     */
    public function storefront(): BelongsTo
    {
        return $this->belongsTo(Storefront::class);
    }

    /**
     * Get the public URL of the account's QR code, if one was uploaded.
     *
     * @return Attribute<string|null, never>
     */
    protected function qrUrl(): Attribute
    {
        return Attribute::get(fn (): ?string => $this->qr_path ? Storage::disk('public')->url($this->qr_path) : null);
    }
}
