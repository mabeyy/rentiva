<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateSettingsRequest;
use App\Models\AdminAction;
use App\Models\Setting;
use App\Models\Storefront;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SettingController extends Controller
{
    /**
     * Show the platform-wide privacy settings.
     */
    public function edit(): Response
    {
        return Inertia::render('admin/settings', [
            'settings' => [
                'data_retention_months' => (int) Setting::get(Setting::DataRetentionMonths),
                'proof_retention_days' => (int) Setting::get(Setting::ProofRetentionDays),
            ],
            'support' => [
                'support_email' => Setting::get(Setting::SupportEmail),
                'support_phone' => Setting::get(Setting::SupportPhone),
                'priority_phone' => Setting::get(Setting::PriorityPhone),
                'priority_response_hours' => (int) Setting::get(Setting::PriorityResponseHours),
            ],
            'dataProtection' => [
                'legal_name' => Setting::get(Setting::LegalName),
                'dpo_name' => Setting::get(Setting::DpoName),
                'dpo_email' => Setting::get(Setting::DpoEmail),
            ],
            'overrideCount' => Storefront::query()
                ->where(fn ($query) => $query->whereNotNull('data_retention_months')->orWhereNotNull('proof_retention_days'))
                ->count(),
        ]);
    }

    /**
     * Save the platform-wide privacy settings.
     */
    public function update(UpdateSettingsRequest $request): RedirectResponse
    {
        foreach ($request->validated() as $key => $value) {
            Setting::put($key, (int) $value);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Settings saved.')]);

        AdminAction::record(null, 'settings_changed');

        return to_route('admin.settings.edit');
    }

    /**
     * Save how owners reach Rentiva, and the priority promise.
     */
    public function updateSupport(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'support_email' => ['nullable', 'email', 'max:255'],
            'support_phone' => ['nullable', 'string', 'max:30'],
            'priority_phone' => ['nullable', 'string', 'max:30'],
            'priority_response_hours' => ['required', 'integer', 'between:1,72'],
        ]);

        foreach ($data as $key => $value) {
            Setting::put($key, $key === 'priority_response_hours' ? (int) $value : $value);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Support details saved.')]);

        AdminAction::record(null, 'settings_changed');

        return to_route('admin.settings.edit');
    }

    /**
     * Save who is responsible for personal data, for the privacy notices.
     */
    public function updateDataProtection(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'legal_name' => ['nullable', 'string', 'max:120'],
            'dpo_name' => ['nullable', 'string', 'max:100'],
            'dpo_email' => ['nullable', 'email', 'max:255'],
        ]);

        foreach ($data as $key => $value) {
            Setting::put($key, $value);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Data protection details saved.')]);

        AdminAction::record(null, 'settings_changed');

        return to_route('admin.settings.edit');
    }
}
