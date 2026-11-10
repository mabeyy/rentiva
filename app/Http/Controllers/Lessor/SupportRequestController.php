<?php

namespace App\Http\Controllers\Lessor;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Lessor\StoreSupportRequestRequest;
use App\Models\Setting;
use App\Models\User;
use App\Notifications\SupportRequested;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;

class SupportRequestController extends Controller
{
    /**
     * Save a question from the Help page for admins, and email it to
     * Rentiva support with replies going back to whoever sent it.
     */
    public function __invoke(StoreSupportRequestRequest $request): RedirectResponse
    {
        // Staff work as their owner here; the request is theirs, so replies reach them.
        $sender = $request->attributes->get('staff') ?? $request->user();

        $supportRequest = $sender->supportRequests()->create([
            ...$request->safe()->only(['topic', 'reference', 'message']),
            'screenshot_path' => $request->file('screenshot')?->store('support', 'local'),
        ]);

        Notification::route('mail', Setting::get(Setting::SupportEmail) ?: config('mail.from.address'))
            ->notify(new SupportRequested($supportRequest));
        Notification::send(User::query()->where('role', UserRole::Admin)->get(), new SupportRequested($supportRequest));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Message sent. We\'ll reply to :email.', ['email' => $sender->email])]);

        return to_route('lessor.help');
    }
}
