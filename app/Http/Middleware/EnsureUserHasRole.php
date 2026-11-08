<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    /**
     * Abort unless the authenticated user has the required role.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string $role): Response
    {
        abort_unless($request->user()?->hasRole(UserRole::from($role)), Response::HTTP_FORBIDDEN);

        return $next($request);
    }
}
