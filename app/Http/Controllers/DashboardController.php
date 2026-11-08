<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Send the user to the dashboard for their role.
     */
    public function __invoke(Request $request): RedirectResponse
    {
        return $request->user()->hasRole(UserRole::Admin)
            ? to_route('admin.dashboard')
            : to_route('lessor.dashboard');
    }
}
