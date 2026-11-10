<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\AdminAction;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ImpersonationController extends Controller
{
    /** Session key holding the admin who is viewing as an owner. */
    public const string SESSION_KEY = 'impersonator_id';

    /**
     * Sign in as an owner to help them, remembering who the admin is.
     */
    public function store(Request $request, User $lessor): RedirectResponse
    {
        abort_unless($lessor->hasRole(UserRole::Lessor), 404);

        $adminId = $request->user()->id;
        AdminAction::record($lessor, 'impersonation_started');
        Auth::login($lessor);
        $request->session()->put(self::SESSION_KEY, $adminId);

        return to_route('lessor.dashboard');
    }

    /**
     * Go back to the admin account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $admin = User::query()->where('role', UserRole::Admin)->whereKey($request->session()->pull(self::SESSION_KEY))->first();
        abort_if($admin === null, 403);

        $ownerId = $request->user()?->id;
        Auth::login($admin);

        if ($ownerId && ($owner = User::find($ownerId))) {
            AdminAction::record($owner, 'impersonation_ended');
        }

        return $ownerId ? to_route('admin.lessors.show', $ownerId) : to_route('admin.dashboard');
    }
}
