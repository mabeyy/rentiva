<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

/**
 * Limits how often one visitor can sign up or ask for password emails, so
 * the forms can't be used to create accounts in bulk or flood inboxes.
 * Login and two-factor have their own limits in Fortify.
 */
class ThrottleAccountForms
{
    /** Tries per visitor per minute. */
    public const int PER_MINUTE = 6;

    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->isMethod('POST') && $request->is('register', 'forgot-password', 'reset-password', 'email/verification-notification')) {
            $key = 'account-forms:'.$request->ip();

            if (RateLimiter::tooManyAttempts($key, self::PER_MINUTE)) {
                abort(Response::HTTP_TOO_MANY_REQUESTS);
            }

            RateLimiter::hit($key, 60);
        }

        return $next($request);
    }
}
