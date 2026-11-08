<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\StorefrontResource;
use App\Models\Setting;
use App\Models\Storefront;
use Inertia\Inertia;
use Inertia\Response;

class PrivacyController extends Controller
{
    /** When the privacy notices last changed; shown at the top of each. */
    private const string LAST_UPDATED = '2026-11-08';

    /**
     * The platform's privacy notice: how Rentiva handles data for owners and
     * the renters who book with them.
     */
    public function platform(): Response
    {
        return Inertia::render('privacy', [
            'lastUpdated' => self::LAST_UPDATED,
            'contactEmail' => config('mail.from.address'),
            'retentionMonths' => (int) Setting::get(Setting::DataRetentionMonths),
            'proofRetentionDays' => (int) Setting::get(Setting::ProofRetentionDays),
        ]);
    }

    /**
     * An owner's privacy notice for their renters, in their branding, with the
     * retention periods that apply to them.
     */
    public function storefront(Storefront $storefront): Response
    {
        abort_unless($storefront->isOpen(), 404);

        $storefront->load('mainPickupLocation');

        return Inertia::render('storefront/privacy', [
            'storefront' => StorefrontResource::make($storefront->load('pickupLocations')),
            'lastUpdated' => self::LAST_UPDATED,
            'privacy' => [
                'ownerEmail' => $storefront->owner->email,
                'address' => $storefront->mainPickupLocation
                    ? "{$storefront->mainPickupLocation->address}, {$storefront->mainPickupLocation->city}"
                    : $storefront->city,
                'retentionMonths' => $storefront->dataRetentionMonths(),
                'acceptsBankTransfer' => $storefront->accepts_bank_transfer,
                'proofRetentionDays' => $storefront->proofRetentionDays(),
                'platformEmail' => config('mail.from.address'),
            ],
        ]);
    }
}
