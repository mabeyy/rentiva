<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/**
 * A platform-wide setting the admin controls, stored by key.
 *
 * @property string $key
 * @property mixed $value
 */
#[Fillable(['key', 'value'])]
class Setting extends Model
{
    public const string DataRetentionMonths = 'data_retention_months';

    public const string ProofRetentionDays = 'proof_retention_days';

    /** Where owners pay Rentiva: a list of {bank_name, account_name, account_number}. */
    public const string PlatformBankAccounts = 'platform_bank_accounts';

    /** Days an invoice can be overdue before the owner's booking page stops taking online bookings. */
    public const string BillingGraceDays = 'billing_grace_days';

    /** How owners reach Rentiva, and the faster line for plans with priority support. */
    public const string SupportEmail = 'support_email';

    public const string SupportPhone = 'support_phone';

    public const string PriorityPhone = 'priority_phone';

    /** Hours within which priority support promises a reply. */
    public const string PriorityResponseHours = 'priority_response_hours';

    /**
     * Values used until the admin saves their own.
     *
     * @var array<string, mixed>
     */
    public const array DEFAULTS = [
        self::DataRetentionMonths => 24,
        self::ProofRetentionDays => 30,
        self::BillingGraceDays => 14,
        self::PriorityResponseHours => 4,
    ];

    protected $primaryKey = 'key';

    protected $keyType = 'string';

    public $incrementing = false;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'value' => 'json',
        ];
    }

    /**
     * A setting's saved value, or its default.
     */
    public static function get(string $key): mixed
    {
        return static::query()->find($key)?->value ?? self::DEFAULTS[$key] ?? null;
    }

    /**
     * Save a setting's value.
     */
    public static function put(string $key, mixed $value): void
    {
        static::query()->updateOrCreate(['key' => $key], ['value' => $value]);
    }
}
