<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\AdminAction;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class LessorSubscriptionController extends Controller
{
    /**
     * Put an owner on a plan, or take them off one.
     */
    public function __invoke(Request $request, User $lessor): RedirectResponse
    {
        abort_unless($lessor->hasRole(UserRole::Lessor), 404);

        $data = $request->validate([
            'plan_id' => ['nullable', 'integer', Rule::exists('plans', 'id')],
        ]);

        $subscription = Subscription::for($lessor);

        if ($data['plan_id'] === null) {
            // Off a plan: forget the paid-up period, so a plan picked later starts that day.
            $subscription->reset();
        } else {
            $subscription->update(['plan_id' => $data['plan_id'], 'cancelled_at' => null, 'pending_plan_id' => null, 'pending_billing_cycle' => null]);
        }

        AdminAction::record($lessor, 'plan_changed', $data['plan_id'] ? Plan::query()->whereKey($data['plan_id'])->value('name') : 'No plan');

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Plan updated for :name.', ['name' => $lessor->storefront->name ?? $lessor->name])]);

        return back();
    }
}
