<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
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

        Subscription::for($lessor)->update($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Plan updated for :name.', ['name' => $lessor->storefront?->name ?? $lessor->name])]);

        return back();
    }
}
