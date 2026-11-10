<?php

namespace App\Providers;

use App\Models\Booking;
use App\Models\NotificationLog;
use Carbon\CarbonImmutable;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Notifications\Events\NotificationFailed;
use Illuminate\Notifications\Events\NotificationSent;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Inertia\ExceptionResponse;
use Inertia\Inertia;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->logEmailDeliveries();
        $this->renderErrorPages();
    }

    /**
     * Show not found, expired, forbidden and server errors as a Rentiva page
     * with a way back, instead of Laravel's plain screen. Server errors keep
     * Laravel's debug page while debugging.
     */
    protected function renderErrorPages(): void
    {
        Inertia::handleExceptionsUsing(function (ExceptionResponse $response) {
            $status = $response->statusCode();

            if (! in_array($status, [403, 404, 419, 429, 500, 503], true) || ($status >= 500 && config('app.debug'))) {
                return null;
            }

            return $response->render('error', ['status' => $status])->withSharedData();
        });
    }

    /**
     * Record every email notification, sent or failed, in the delivery log
     * owners and admins can check.
     */
    protected function logEmailDeliveries(): void
    {
        $record = function (object $notifiable, Notification $notification, bool $sent, ?string $error = null): void {
            $booking = property_exists($notification, 'booking') && $notification->booking instanceof Booking ? $notification->booking : null;
            $recipient = $notifiable instanceof AnonymousNotifiable
                ? $this->emailFromRoute($notifiable->routeNotificationFor('mail'))
                : (string) ($notifiable->email ?? '');

            NotificationLog::record($booking, 'mail', $recipient, class_basename($notification), $sent, $error);
        };

        Event::listen(NotificationSent::class, function (NotificationSent $event) use ($record): void {
            if ($event->channel === 'mail') {
                $record($event->notifiable, $event->notification, true);
            }
        });

        Event::listen(NotificationFailed::class, function (NotificationFailed $event) use ($record): void {
            if ($event->channel === 'mail') {
                $record($event->notifiable, $event->notification, false, (string) data_get($event->data, 'exception')?->getMessage());
            }
        });
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        JsonResource::withoutWrapping();

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }

    /**
     * The address from an on-demand mail route: either "a@b.c" or ["a@b.c" => "Name"].
     */
    private function emailFromRoute(mixed $route): string
    {
        if (! is_array($route)) {
            return (string) $route;
        }

        $key = array_key_first($route);

        return (string) (is_string($key) ? $key : ($route[$key] ?? ''));
    }
}
