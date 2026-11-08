<?php

namespace App\Http\Middleware;

use App\Models\TeamMember;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Keeps staff to the parts of the owner area they were given. Owners pass
 * every check; "owner" pages are never open to staff.
 */
class EnsureStaffCan
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $membership = $request->attributes->get('staffMembership');

        if ($membership instanceof TeamMember) {
            abort_if($permission === 'owner' || ! $membership->can($permission), Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}
