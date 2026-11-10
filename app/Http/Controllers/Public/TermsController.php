<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Setting;
use Inertia\Inertia;
use Inertia\Response;

class TermsController extends Controller
{
    /** When the terms last changed; shown at the top. */
    private const string LAST_UPDATED = '2026-11-09';

    /**
     * The terms for renters and for the rental businesses that use Rentiva,
     * with the billing numbers they depend on.
     */
    public function __invoke(): Response
    {
        return Inertia::render('terms', [
            'lastUpdated' => self::LAST_UPDATED,
            'contactEmail' => Setting::get(Setting::SupportEmail) ?: config('mail.from.address'),
            'daysToPay' => Invoice::DAYS_TO_PAY,
            'graceDays' => (int) Setting::get(Setting::BillingGraceDays),
        ]);
    }
}
