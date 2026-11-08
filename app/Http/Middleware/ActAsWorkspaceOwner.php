<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;
use App\Models\TeamMember;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Lets staff work in their employer's owner area: for the rest of the
 * request the owner is the signed-in user, so every page and policy works
 * unchanged, while the staff member is kept on the request for permission
 * checks and the activity log. Nothing is written to the session.
 */
class ActAsWorkspaceOwner
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user?->hasRole(UserRole::Staff)) {
            $membership = $user->teamMembership()->with('owner')->first();
            abort_unless($membership instanceof TeamMember && $membership->owner, Response::HTTP_FORBIDDEN);

            $request->attributes->set('staff', $user);
            $request->attributes->set('staffMembership', $membership);
            Auth::setUser($membership->owner);
            $request->setUserResolver(fn () => $membership->owner);

            try {
                return $next($request);
            } finally {
                // Hand the staff member back, so nothing later in this process
                // (a test, a long-running worker) carries on as the owner.
                Auth::setUser($user);
            }
        }

        return $next($request);
    }
}
