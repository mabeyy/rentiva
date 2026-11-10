<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;
use App\Models\Plan;
use App\Models\Setting;
use App\Models\TeamMember;
use App\Models\User;
use App\Rules\Turnstile;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user(),
            ],
            // The bell for owners (and their staff) and admins: unread count
            // and the latest alerts, loaded lazily.
            'notifications' => function () use ($request): ?array {
                $user = $request->user();
                $area = match (true) {
                    (bool) $user?->hasRole(UserRole::Lessor) => 'lessor',
                    (bool) $user?->hasRole(UserRole::Admin) => 'admin',
                    default => null,
                };

                if ($area === null) {
                    return null;
                }

                // Staff working as their owner only see the alerts their permissions cover.
                $actions = $area === 'lessor' ? TeamMember::visibleAlertActions() : null;
                $alerts = fn () => TeamMember::onlyAlerts($user->notifications(), $actions);

                return [
                    'unread' => $alerts()->whereNull('read_at')->count(),
                    'read_url' => route("{$area}.notifications.read"),
                    'items' => $alerts()->latest()->limit(8)->get()
                        ->map(fn (DatabaseNotification $notification): array => [
                            'id' => $notification->id,
                            ...$notification->data,
                            'open_url' => route("{$area}.notifications.show", $notification->id),
                            'read' => $notification->read_at !== null,
                            'created_at' => $notification->created_at?->toIso8601String(),
                        ]),
                ];
            },
            // What the owner's plan unlocks, so pages can show upgrade notes.
            'planFeatures' => fn (): ?array => $request->user()?->hasRole(UserRole::Lessor)
                ? array_values(array_filter(array_keys(Plan::FEATURES), fn (string $feature): bool => $request->user()->planIncludes($feature)))
                : null,
            // Set while an admin is viewing the app as an owner.
            'impersonation' => fn (): ?array => ($admin = User::impersonator()) ? [
                'admin_name' => $admin->name,
                'owner_name' => $request->user()?->storefront->name ?? $request->user()?->name,
            ] : null,
            // The owner's plan status, for a reminder banner. Staff don't see it.
            'billing' => function () use ($request): ?array {
                $user = $request->user();

                if (! $user?->hasRole(UserRole::Lessor) || $request->attributes->has('staff')) {
                    return null;
                }

                return [
                    'overdue' => $user->invoices()->whereIn('status', ['unpaid', 'rejected'])->whereDate('due_on', '<', today())->count(),
                    'paused' => $user->isBillingPaused(),
                    'grace_days' => (int) Setting::get(Setting::BillingGraceDays),
                    'unpaid' => $user->invoices()->whereIn('status', ['unpaid', 'rejected'])->count(),
                    'has_plan' => $user->hasPlan(),
                ];
            },
            // Set when a staff member is working in their employer's owner area.
            'workspace' => function () use ($request): ?array {
                $membership = $request->attributes->get('staffMembership');

                return $membership instanceof TeamMember ? [
                    'owner_name' => $membership->owner->storefront->name ?? $membership->owner->name,
                    'permissions' => $membership->permissions,
                ] : null;
            },
            // The owner's own booking page, for "View booking page" in the
            // sidebar. Staff work as their owner, so they get the same one.
            'publicSiteUrl' => fn (): ?string => ($storefront = $request->user()?->storefront)
                ? route('storefronts.show', $storefront)
                : null,
            'turnstileSiteKey' => Turnstile::isEnabled() ? config('services.turnstile.site_key') : null,
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
