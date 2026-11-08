<?php

namespace App\Http\Controllers\Lessor;

use App\Actions\Integrations\GoogleCalendarClient;
use App\Actions\Integrations\OwnerMailer;
use App\Actions\Integrations\SendSms;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\NotificationLog;
use App\Models\Plan;
use App\Models\Storefront;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

/**
 * An owner's own email (Resend), SMS (Semaphore) and Google Calendar
 * connections, plus the log of what was sent. Admins reach the same pages
 * under an owner (admin/lessors/{lessor}/connections) to set them up for them.
 * Secrets are never sent to the browser; a blank key field keeps the saved one.
 */
class ConnectionController extends Controller
{
    public function email(Request $request, ?User $lessor = null): Response
    {
        $storefront = $this->storefront($request, $lessor);

        return Inertia::render('lessor/connections/email', [
            ...$this->context($request, $lessor, 'email'),
            'settings' => $storefront ? [
                'has_api_key' => filled($storefront->resend_api_key),
                'mail_from_address' => $storefront->mail_from_address,
                'test_recipient' => $storefront->owner->email,
                ...$this->reminders($storefront, 'email'),
            ] : null,
        ]);
    }

    public function updateEmail(Request $request, ?User $lessor = null): RedirectResponse
    {
        abort_unless($this->canEdit($request, $lessor, 'email'), 403);
        $storefront = $this->requireStorefront($request, $lessor);

        if ($request->boolean('disconnect')) {
            $storefront->update(['resend_api_key' => null, 'mail_from_address' => null]);

            return $this->saved(__('Email disconnected. Renter emails use the platform mailer again.'));
        }

        $data = $request->validate([
            'resend_api_key' => [Rule::requiredIf(blank($storefront->resend_api_key)), 'nullable', 'string', 'starts_with:re_', 'max:200'],
            'mail_from_address' => ['required', 'email', 'max:255'],
        ], ['resend_api_key.starts_with' => __('Resend API keys start with "re_".')]);

        $storefront->update(array_filter($data, fn (mixed $value): bool => filled($value)));

        return $this->saved(__('Email settings saved.'));
    }

    public function testEmail(Request $request, ?User $lessor = null): RedirectResponse
    {
        abort_unless($this->canEdit($request, $lessor, 'email'), 403);
        $storefront = $this->requireStorefront($request, $lessor);
        $data = $request->validate([
            'resend_api_key' => ['nullable', 'string', 'max:200'],
            'mail_from_address' => ['required', 'email'],
            'test_recipient' => ['required', 'email'],
        ]);

        $candidate = $storefront->replicate()->forceFill([
            'resend_api_key' => $data['resend_api_key'] ?: $storefront->resend_api_key,
            'mail_from_address' => $data['mail_from_address'],
        ]);
        $candidate->id = $storefront->id;
        // Admins can test the setup before the owner's plan includes it.
        $mailer = app(OwnerMailer::class)->mailerFor($candidate, ignorePlan: true);

        if ($mailer === null) {
            return $this->failed(__('Add your Resend API key first.'));
        }

        try {
            Mail::mailer($mailer)->raw(
                __('This is a test from :app. Renter emails for :owner will be sent like this.', ['app' => config('app.name'), 'owner' => $storefront->name]),
                fn ($message) => $message->to($data['test_recipient'])
                    ->from($data['mail_from_address'], $storefront->name)
                    ->subject(__('Test email from :owner', ['owner' => $storefront->name])),
            );
            NotificationLog::record(null, 'mail', $data['test_recipient'], 'Test email', true, storefront: $storefront);
        } catch (Throwable $exception) {
            NotificationLog::record(null, 'mail', $data['test_recipient'], 'Test email', false, $exception->getMessage(), $storefront);

            return $this->failed(__('Resend refused the email. Check the API key and that the sender address is on a verified domain.'));
        }

        return $this->saved(__('Test email sent to :to.', ['to' => $data['test_recipient']]));
    }

    public function sms(Request $request, ?User $lessor = null): Response
    {
        $storefront = $this->storefront($request, $lessor);

        return Inertia::render('lessor/connections/sms', [
            ...$this->context($request, $lessor, 'sms'),
            'settings' => $storefront ? [
                'has_api_key' => filled($storefront->semaphore_api_key),
                'sms_sender_name' => $storefront->sms_sender_name,
                'sms_enabled' => $storefront->sms_enabled,
                'test_recipient' => $storefront->phone,
                ...$this->reminders($storefront, 'sms'),
            ] : null,
        ]);
    }

    public function updateSms(Request $request, ?User $lessor = null): RedirectResponse
    {
        abort_unless($this->canEdit($request, $lessor, 'sms'), 403);
        $storefront = $this->requireStorefront($request, $lessor);

        if ($request->boolean('disconnect')) {
            $storefront->update(['semaphore_api_key' => null, 'sms_enabled' => false]);

            return $this->saved(__('SMS disconnected.'));
        }

        $request->merge(['sms_enabled' => $request->boolean('sms_enabled')]);
        $data = $request->validate([
            'semaphore_api_key' => [Rule::requiredIf(blank($storefront->semaphore_api_key) && $request->boolean('sms_enabled')), 'nullable', 'string', 'max:200'],
            'sms_sender_name' => ['nullable', 'string', 'max:11', 'alpha_num'],
            'sms_enabled' => ['boolean'],
        ], ['sms_sender_name.max' => __('Sender names can be at most 11 characters.')]);

        $storefront->update(array_filter($data, fn (mixed $value, string $key): bool => $key !== 'semaphore_api_key' || filled($value), ARRAY_FILTER_USE_BOTH));

        return $this->saved(__('SMS settings saved.'));
    }

    public function testSms(Request $request, ?User $lessor = null): RedirectResponse
    {
        abort_unless($this->canEdit($request, $lessor, 'sms'), 403);
        $storefront = $this->requireStorefront($request, $lessor);
        $data = $request->validate([
            'semaphore_api_key' => ['nullable', 'string', 'max:200'],
            'sms_sender_name' => ['nullable', 'string', 'max:11'],
            'test_recipient' => ['required', 'string'],
        ]);
        $apiKey = $data['semaphore_api_key'] ?: $storefront->semaphore_api_key;

        if (blank($apiKey)) {
            return $this->failed(__('Add your Semaphore API key first.'));
        }

        $sent = app(SendSms::class)->deliver($apiKey, $data['sms_sender_name'] ?? null, $data['test_recipient'], __('Test from :owner on :app: SMS notifications are working.', ['owner' => $storefront->name, 'app' => config('app.name')]), storefront: $storefront);

        return $sent
            ? $this->saved(__('Test SMS sent to :to.', ['to' => $data['test_recipient']]))
            : $this->failed(__('Semaphore refused the text. Check the API key, sender name and phone number.'));
    }

    public function calendar(Request $request, ?User $lessor = null): Response
    {
        $storefront = $this->storefront($request, $lessor);

        return Inertia::render('lessor/connections/calendar', [
            ...$this->context($request, $lessor, 'calendar'),
            'settings' => $storefront ? [
                'google_calendar_id' => $storefront->google_calendar_id,
                'google_client_email' => $storefront->google_client_email,
                'has_private_key' => filled($storefront->google_private_key),
                'google_calendar_enabled' => $storefront->google_calendar_enabled,
            ] : null,
        ]);
    }

    public function updateCalendar(Request $request, ?User $lessor = null): RedirectResponse
    {
        abort_unless($this->canEdit($request, $lessor, 'calendar'), 403);
        $storefront = $this->requireStorefront($request, $lessor);

        if ($request->boolean('disconnect')) {
            $storefront->update(['google_private_key' => null, 'google_calendar_enabled' => false]);
            app(GoogleCalendarClient::class)->forgetToken($storefront);

            return $this->saved(__('Google Calendar disconnected.'));
        }

        $request->merge(['google_calendar_enabled' => $request->boolean('google_calendar_enabled')]);
        $data = $request->validate([
            'google_calendar_id' => ['required', 'string', 'max:255'],
            'google_client_email' => ['required', 'email', 'max:255'],
            'google_private_key' => [Rule::requiredIf(blank($storefront->google_private_key)), 'nullable', 'string', 'max:5000'],
            'google_calendar_enabled' => ['boolean'],
        ]);

        $storefront->update(array_filter($data, fn (mixed $value, string $key): bool => $key !== 'google_private_key' || filled($value), ARRAY_FILTER_USE_BOTH));
        app(GoogleCalendarClient::class)->forgetToken($storefront);

        return $this->saved(__('Google Calendar settings saved.'));
    }

    public function testCalendar(Request $request, ?User $lessor = null): RedirectResponse
    {
        abort_unless($this->canEdit($request, $lessor, 'calendar'), 403);
        $storefront = $this->requireStorefront($request, $lessor);
        $data = $request->validate([
            'google_calendar_id' => ['required', 'string'],
            'google_client_email' => ['required', 'email'],
            'google_private_key' => ['nullable', 'string'],
        ]);
        $privateKey = $data['google_private_key'] ?: $storefront->google_private_key;

        if (blank($privateKey)) {
            return $this->failed(__('Paste the service account private key first.'));
        }

        try {
            app(GoogleCalendarClient::class)->verify($data['google_calendar_id'], $data['google_client_email'], (string) $privateKey);
        } catch (Throwable) {
            return $this->failed(__('Google refused the connection. Check the key, and that the calendar is shared with the service account email.'));
        }

        return $this->saved(__('Connected to Google Calendar.'));
    }

    /**
     * Switch the 24-hour and 2-hour pickup reminders on or off, per channel.
     * Saved on each toggle, separately from the connection settings.
     */
    public function updateReminders(Request $request, ?User $lessor = null): RedirectResponse
    {
        $storefront = $this->requireStorefront($request, $lessor);
        $data = $request->validate([
            'remind_email_24h' => ['sometimes', 'boolean'],
            'remind_email_2h' => ['sometimes', 'boolean'],
            'remind_sms_24h' => ['sometimes', 'boolean'],
            'remind_sms_2h' => ['sometimes', 'boolean'],
        ]);

        $storefront->update($data);

        return $this->saved(__('Reminders updated.'));
    }

    public function deliveries(Request $request, ?User $lessor = null): Response
    {
        $storefront = $this->storefront($request, $lessor);
        $filters = $request->validate([
            'channel' => ['nullable', Rule::in(['mail', 'sms'])],
            'status' => ['nullable', Rule::in(['sent', 'failed'])],
        ]);

        return Inertia::render('lessor/connections/deliveries', [
            ...$this->context($request, $lessor, 'deliveries'),
            'deliveries' => $storefront
                ? NotificationLog::query()
                    ->where('storefront_id', $storefront->id)
                    ->with('booking:id,reference')
                    ->when($filters['channel'] ?? null, fn ($query, string $channel) => $query->where('channel', $channel))
                    ->when($filters['status'] ?? null, fn ($query, string $status) => $query->where('status', $status))
                    ->latest('id')
                    ->paginate(25)
                    ->withQueryString()
                    ->through(fn (NotificationLog $log): array => [
                        'id' => $log->id,
                        'channel' => $log->channel,
                        'recipient' => $log->recipient,
                        'summary' => $log->summary,
                        'status' => $log->status,
                        'error' => $log->error,
                        'reference' => $log->booking?->reference,
                        'created_at' => $log->created_at?->toIso8601String(),
                    ])
                : null,
            'filters' => (object) $filters,
        ]);
    }

    /**
     * The storefront being configured: an admin's chosen owner, or the lessor's own.
     */
    private function storefront(Request $request, ?User $lessor): ?Storefront
    {
        abort_if($lessor && ! $lessor->hasRole(UserRole::Lessor), 404);

        return ($lessor ?? $request->user())->storefront;
    }

    private function requireStorefront(Request $request, ?User $lessor): Storefront
    {
        $storefront = $this->storefront($request, $lessor);
        abort_unless($storefront && ($lessor || ! $request->user()->isSuspended()), 403);

        return $storefront;
    }

    /**
     * URLs for the page's forms and tabs, so the same page works for owners and admins.
     *
     * @return array<string, mixed>
     */
    private function context(Request $request, ?User $lessor, string $page): array
    {
        $route = fn (string $name): string => $lessor
            ? route("admin.lessors.connections.{$name}", $lessor)
            : route("lessor.connections.{$name}");

        $owner = $lessor ?? $request->user();
        $canEdit = $this->canEdit($request, $lessor, $page);

        return [
            'page' => $page,
            // Email and SMS are set up by Rentiva; owners can set up their own
            // calendar sync when their plan includes it.
            'canEdit' => $canEdit,
            'plan' => [
                'name' => $owner->subscription?->plan?->name,
                ...collect(Plan::FEATURES)->mapWithKeys(fn (string $label, string $key): array => [$key => $owner->planIncludes($key)])->all(),
            ],
            'managedOwner' => $lessor ? ['name' => $lessor->name, 'business' => $lessor->storefront?->name, 'url' => route('admin.lessors.show', $lessor)] : null,
            'urls' => [
                'email' => $route('email'),
                'sms' => $route('sms'),
                'calendar' => $route('calendar'),
                'deliveries' => $route('deliveries'),
                'reminders' => $route('reminders.update'),
                'policies' => $lessor ? null : route('lessor.policies.edit'),
                'update' => $canEdit && $page !== 'deliveries' ? $route("{$page}.update") : null,
                'test' => $canEdit && $page !== 'deliveries' ? $route("{$page}.test") : null,
                'billing' => $lessor ? null : route('lessor.billing.index'),
            ],
        ];
    }

    /**
     * Whether the person looking can change a connection's settings: admins
     * always; owners only their calendar, and only if their plan includes it.
     */
    private function canEdit(Request $request, ?User $lessor, string $page): bool
    {
        return match (true) {
            $lessor !== null => true,
            $page === 'calendar' => $request->user()->planIncludes('calendar_sync'),
            default => false,
        };
    }

    /**
     * A channel's reminder switches and the pickup time they count back from.
     *
     * @return array<string, mixed>
     */
    private function reminders(Storefront $storefront, string $channel): array
    {
        return [
            'reminders' => [
                'remind_24h' => $storefront->{"remind_{$channel}_24h"},
                'remind_2h' => $storefront->{"remind_{$channel}_2h"},
                'pickup_time' => $storefront->pickup_time,
            ],
        ];
    }

    private function saved(string $message): RedirectResponse
    {
        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return back();
    }

    private function failed(string $message): RedirectResponse
    {
        Inertia::flash('toast', ['type' => 'error', 'message' => $message]);

        return back();
    }
}
