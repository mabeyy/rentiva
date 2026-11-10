<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateLessorRetentionRequest;
use App\Models\AdminAction;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

class LessorRetentionController extends Controller
{
    /**
     * Give one owner their own retention periods, or clear them back to the
     * platform's.
     */
    public function __invoke(UpdateLessorRetentionRequest $request, User $lessor): RedirectResponse
    {
        abort_unless($lessor->hasRole(UserRole::Lessor) && $lessor->storefront, 404);

        $lessor->storefront->update([
            'data_retention_months' => $request->integer('data_retention_months') ?: null,
            'proof_retention_days' => $request->integer('proof_retention_days') ?: null,
        ]);

        AdminAction::record($lessor, 'retention_changed', __(':months months, proofs :days days', [
            'months' => $lessor->storefront->data_retention_months ?? 'default',
            'days' => $lessor->storefront->proof_retention_days ?? 'default',
        ]));
        Inertia::flash('toast', ['type' => 'success', 'message' => __('Retention saved.')]);

        return back();
    }
}
