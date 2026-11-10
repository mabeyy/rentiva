<?php

namespace App\Http\Controllers\Lessor;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\TeamMember;
use App\Models\User;
use App\Notifications\StaffInvitation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class TeamController extends Controller
{
    /**
     * The owner's staff and what each can do.
     */
    public function index(Request $request): Response
    {
        return Inertia::render('lessor/team', [
            'members' => $request->user()->team()->with('user')->oldest()->get()->map(fn (TeamMember $member): array => [
                'id' => $member->id,
                'name' => $member->user->name,
                'email' => $member->user->email,
                'permissions' => $member->permissions,
            ]),
            'permissions' => collect(TeamMember::PERMISSIONS)->map(fn (string $label, string $value): array => ['value' => $value, 'label' => $label])->values(),
            'staffLimit' => $request->user()->planLimit('max_staff'),
        ]);
    }

    /**
     * Invite a staff member: they get an email to set their password.
     */
    public function store(Request $request): RedirectResponse
    {
        $owner = $request->user();
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            ...$this->permissionRules(),
        ], ['email.unique' => __('That email already has a Rentiva account.')]);

        $limit = $owner->planLimit('max_staff');

        if ($limit !== null && $owner->team()->count() >= $limit) {
            throw ValidationException::withMessages(['email' => __('Your plan allows :count staff. Upgrade under Billing to add more.', ['count' => $limit])]);
        }

        $member = DB::transaction(function () use ($owner, $data): TeamMember {
            $user = User::forceCreate([
                'name' => $data['name'],
                'email' => strtolower($data['email']),
                'password' => Str::password(32),
                'role' => UserRole::Staff,
                'email_verified_at' => now(),
            ]);

            return $owner->team()->create(['user_id' => $user->id, 'permissions' => $data['permissions']]);
        });

        $member->user->notify(new StaffInvitation($owner));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Invitation sent to :email.', ['email' => $member->user->email])]);

        return back();
    }

    /**
     * Change what a staff member can do.
     */
    public function update(Request $request, TeamMember $member): RedirectResponse
    {
        abort_unless($member->owner()->is($request->user()), 403);

        $member->update(['permissions' => $request->validate($this->permissionRules())['permissions']]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Access updated.')]);

        return back();
    }

    /**
     * Send the invitation again, with a fresh link to choose a password.
     */
    public function resend(Request $request, TeamMember $member): RedirectResponse
    {
        abort_unless($member->owner()->is($request->user()), 403);

        $member->user->notify(new StaffInvitation($request->user()));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Invitation sent again to :email.', ['email' => $member->user->email])]);

        return back();
    }

    /**
     * Remove a staff member. Their account is deleted; what they did stays in
     * the activity log under their name.
     */
    public function destroy(Request $request, TeamMember $member): RedirectResponse
    {
        abort_unless($member->owner()->is($request->user()), 403);

        $member->user->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Staff member removed.')]);

        return back();
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    private function permissionRules(): array
    {
        return [
            'permissions' => ['required', 'array', 'min:1'],
            'permissions.*' => [Rule::in(array_keys(TeamMember::PERMISSIONS))],
        ];
    }
}
