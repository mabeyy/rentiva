<?php

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Review;
use App\Notifications\BookingStatusChanged;
use App\Notifications\ReviewReminder;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Support\Facades\Notification;

beforeEach(function () {
    Notification::fake();
});

/**
 * A booking that ended the given number of days ago.
 */
function bookingEndedDaysAgo(int $days, BookingStatus $status = BookingStatus::Confirmed): Booking
{
    return Booking::factory()
        ->between(today()->subDays($days + 2)->toDateString(), today()->subDays($days)->toDateString())
        ->create(['status' => $status]);
}

test('trips the owner didn\'t close are completed two days after the return date, and the renter is asked to rate them', function () {
    $finished = bookingEndedDaysAgo(2);
    $justReturned = bookingEndedDaysAgo(1);
    $neverConfirmed = bookingEndedDaysAgo(5, BookingStatus::Pending);
    $longAgo = bookingEndedDaysAgo(60);

    $this->artisan('bookings:complete-finished')->assertSuccessful();

    expect($finished->fresh()->status)->toBe(BookingStatus::Completed)
        ->and($justReturned->fresh()->status)->toBe(BookingStatus::Confirmed)
        ->and($neverConfirmed->fresh()->status)->toBe(BookingStatus::Pending)
        ->and($longAgo->fresh()->status)->toBe(BookingStatus::Completed)
        ->and($finished->events()->latest('id')->first())->action->toBe('completed')->actor_type->toBe('system');

    Notification::assertSentOnDemand(BookingStatusChanged::class, function (BookingStatusChanged $notification, array $channels, AnonymousNotifiable $notifiable) use ($finished): bool {
        $mail = $notification->toMail($notifiable);

        return $notification->booking->is($finished)
            && str_starts_with($mail->subject, 'How was your trip with')
            && $mail->actionText === 'Rate your trip'
            && $mail->actionUrl === $finished->manageUrl().'#review';
    });
    // A trip from two months ago is closed without asking.
    Notification::assertSentOnDemandTimes(BookingStatusChanged::class, 1);
});

test('renters who haven\'t reviewed get one reminder a week after their trip', function () {
    $toRemind = bookingEndedDaysAgo(7, BookingStatus::Completed);
    $reviewed = bookingEndedDaysAgo(7, BookingStatus::Completed);
    Review::factory()->for($reviewed)->create();
    bookingEndedDaysAgo(8, BookingStatus::Completed);

    $this->artisan('bookings:complete-finished')->assertSuccessful();

    Notification::assertSentOnDemandTimes(ReviewReminder::class, 1);
    Notification::assertSentOnDemand(ReviewReminder::class, fn (ReviewReminder $notification): bool => $notification->booking->is($toRemind));
});
