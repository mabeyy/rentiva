<?php

namespace App\Http\Controllers\Lessor;

use App\Http\Controllers\Controller;
use App\Models\TeamMember;
use App\Models\User;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;

class NotificationController extends Controller
{
    /**
     * Open an alert: mark it read and go to its booking.
     */
    public function show(Request $request, string $notification): RedirectResponse
    {
        $alert = $this->visibleAlerts($request)->findOrFail($notification);
        $alert->markAsRead();

        return redirect($alert->data['url'] ?? route('lessor.dashboard'));
    }

    /**
     * Mark every alert as read.
     */
    public function readAll(Request $request): RedirectResponse
    {
        // Staff only clear the alerts they can see, not the owner's others.
        $this->visibleAlerts($request)->whereNull('read_at')->update(['read_at' => now()]);

        return back();
    }

    /**
     * The owner's alerts that the person looking may see.
     *
     * @return MorphMany<DatabaseNotification, User>
     */
    private function visibleAlerts(Request $request): MorphMany
    {
        $actions = TeamMember::visibleAlertActions();

        return TeamMember::onlyAlerts($request->user()->notifications(), $actions);
    }
}
