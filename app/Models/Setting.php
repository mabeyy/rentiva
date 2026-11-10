<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

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

    /** Where owners pay Rentiva: a list of {bank_name, account_name, account_number, qr_path}. */
    public const string PlatformBankAccounts = 'platform_bank_accounts';

    /** Days an invoice can be overdue before the owner's booking page stops taking online bookings. */
    public const string BillingGraceDays = 'billing_grace_days';

    /** How owners reach Rentiva, and the faster line for plans with priority support. */
    public const string SupportEmail = 'support_email';

    public const string SupportPhone = 'support_phone';

    public const string PriorityPhone = 'priority_phone';

    /** The registered business behind Rentiva, named as controller on the privacy notices. */
    public const string LegalName = 'legal_name';

    /** The Data Protection Officer the Data Privacy Act requires, shown on the privacy notices. */
    public const string DpoName = 'dpo_name';

    public const string DpoEmail = 'dpo_email';

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
        return static::query()->find($key)->value ?? self::DEFAULTS[$key] ?? null;
    }

    /**
     * Where owners pay Rentiva, each with its QR code's public address.
     *
     * @return list<array{bank_name: string, account_name: string, account_number: string, qr_path: string|null, qr_url: string|null}>
     */
    public static function platformBankAccounts(): array
    {
        $accounts = static::get(self::PlatformBankAccounts);

        return array_values(array_map(fn (array $account): array => [
            'bank_name' => $account['bank_name'],
            'account_name' => $account['account_name'],
            'account_number' => $account['account_number'],
            'qr_path' => $account['qr_path'] ?? null,
            'qr_url' => isset($account['qr_path']) ? Storage::disk('public')->url($account['qr_path']) : null,
        ], is_array($accounts) ? $accounts : []));
    }

    /**
     * Save a setting's value.
     */
    public static function put(string $key, mixed $value): void
    {
        static::query()->updateOrCreate(['key' => $key], ['value' => $value]);
    }
}
