<?php

use App\Enums\BookingStatus;

test('bookings move only along the allowed lifecycle', function (BookingStatus $from, BookingStatus $to, bool $allowed) {
    expect($from->canTransitionTo($to))->toBe($allowed);
})->with([
    'pending → confirmed' => [BookingStatus::Pending, BookingStatus::Confirmed, true],
    'pending → declined' => [BookingStatus::Pending, BookingStatus::Declined, true],
    'pending → cancelled' => [BookingStatus::Pending, BookingStatus::Cancelled, true],
    'pending → completed' => [BookingStatus::Pending, BookingStatus::Completed, false],
    'confirmed → completed' => [BookingStatus::Confirmed, BookingStatus::Completed, true],
    'confirmed → cancelled' => [BookingStatus::Confirmed, BookingStatus::Cancelled, true],
    'confirmed → declined' => [BookingStatus::Confirmed, BookingStatus::Declined, false],
    'declined → confirmed' => [BookingStatus::Declined, BookingStatus::Confirmed, false],
    'cancelled → confirmed' => [BookingStatus::Cancelled, BookingStatus::Confirmed, false],
    'completed → cancelled' => [BookingStatus::Completed, BookingStatus::Cancelled, false],
]);
