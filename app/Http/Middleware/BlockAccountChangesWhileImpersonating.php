<?php

namespace App\Http\Middleware;

use App\Http\Controllers\Admin\ImpersonationController;
use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

/**
 * While an admin views the app as an owner, the owner's own account (profile,
 * email, password, two-factor, passkeys, deletion) stays off-limits.
 */
class BlockAccountChangesWhileImpersonating
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $isImpersonating = $request->hasSession() && $request->session()->has(ImpersonationController::SESSION_KEY);

        if ($isImpersonating && ($request->is('settings', 'settings/*', 'user/*'))) {
            abort_unless($request->isMethod('GET'), Response::HTTP_FORBIDDEN);

            Inertia::flash('toast', ['type' => 'error', 'message' => __('Account settings are off-limits while viewing as an owner.')]);

            return to_route('lessor.dashboard');
        }

        return $next($request);
    }
}
