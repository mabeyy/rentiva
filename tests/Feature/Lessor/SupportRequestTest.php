<?php

use App\Models\Setting;
use App\Models\Storefront;
use App\Models\SupportRequest;
use App\Models\TeamMember;
use App\Models\User;
use App\Notifications\SupportRequested;
use Illuminate\Http\UploadedFile;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    Notification::fake();
    Storage::fake('local');
    Setting::put(Setting::SupportEmail, 'help@rentiva.ph');
});

test('an owner\'s help request is saved, emailed to support with replies to them, and shown in admins\' bell', function () {
    $owner = Storefront::factory()->create(['name' => 'ABQ Car Rental'])->owner;
    $admin = User::factory()->admin()->create();

    $this->actingAs($owner)->post(route('lessor.help.store'), [
        'topic' => 'bookings',
        'reference' => 'RNT-ABC123',
        'message' => 'A renter says the booking link does not open.',
        'screenshot' => UploadedFile::fake()->image('error.png'),
    ])->assertRedirect(route('lessor.help'));

    $supportRequest = SupportRequest::sole();
    expect($supportRequest)
        ->user_id->toBe($owner->id)
        ->reference->toBe('RNT-ABC123')
        ->resolved_at->toBeNull();
    Storage::disk('local')->assertExists($supportRequest->screenshot_path);

    Notification::assertSentTo(
        new AnonymousNotifiable,
        SupportRequested::class,
        function (SupportRequested $notification, array $channels, AnonymousNotifiable $notifiable) use ($owner): bool {
            $mail = $notification->toMail($notifiable);

            return $notifiable->routes['mail'] === 'help@rentiva.ph'
                && $mail->replyTo === [[$owner->email, $owner->name]]
                && $mail->subject === 'Help request: Bookings and payments'
                && in_array('About: RNT-ABC123', $mail->introLines, true)
                && count($mail->attachments) === 1;
        },
    );
    Notification::assertSentTo($admin, SupportRequested::class, fn (SupportRequested $notification): bool => $notification->via($admin) === ['database']
        && str_starts_with($notification->toArray($admin)['body'], 'ABQ Car Rental:'));
});

test('staff can ask for help too', function () {
    $member = TeamMember::factory()->for(Storefront::factory()->create()->owner, 'owner')->create();

    $this->actingAs($member->user)->post(route('lessor.help.store'), [
        'topic' => 'other',
        'message' => 'How do I change my password?',
    ])->assertSessionHasNoErrors();

    expect(SupportRequest::sole()->user_id)->toBe($member->user_id);
});

test('a help request needs a known topic and a real message', function () {
    $owner = Storefront::factory()->create()->owner;

    $this->actingAs($owner)->post(route('lessor.help.store'), [
        'topic' => 'refunds',
        'message' => 'The page is broken',
    ])->assertSessionHasErrors(['topic', 'message' => 'Tell us a little more so we can help (at least 20 characters).']);

    expect(SupportRequest::count())->toBe(0);
    Notification::assertNothingSent();
});

test('admins see open requests, and resolving one deletes its screenshot', function () {
    Storage::disk('local')->put('support/error.png', 'image');
    $supportRequest = SupportRequest::factory()->create(['screenshot_path' => 'support/error.png']);
    SupportRequest::factory()->resolved()->create();
    $this->actingAs(User::factory()->admin()->create());

    $this->get(route('admin.support.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/support')
            ->where('counts.open', 1)
            ->has('requests.data', 1)
            ->where('requests.data.0.id', $supportRequest->id)
            ->where('requests.data.0.has_screenshot', true));
    $this->get(route('admin.support.screenshot', $supportRequest))->assertOk();

    $this->put(route('admin.support.update', $supportRequest), ['resolved' => true])->assertSessionHasNoErrors();

    expect($supportRequest->fresh())->resolved_at->not->toBeNull()->screenshot_path->toBeNull();
    Storage::disk('local')->assertMissing('support/error.png');
});

test('only admins can see help requests', function () {
    $supportRequest = SupportRequest::factory()->create();
    $this->actingAs(Storefront::factory()->create()->owner);

    $this->get(route('admin.support.index'))->assertForbidden();
    $this->put(route('admin.support.update', $supportRequest), ['resolved' => true])->assertForbidden();
});
