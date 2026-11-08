<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Open an alert: mark it read and go to its booking.
     */
    public function show(Request $request, string $notification): RedirectResponse
    {
        $alert = $request->user()->notifications()->findOrFail($notification);
        $alert->markAsRead();

        return redirect($alert->data['url'] ?? route('admin.dashboard'));
    }

    /**
     * Mark every alert as read.
     */
    public function readAll(Request $request): RedirectResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return back();
    }
}
