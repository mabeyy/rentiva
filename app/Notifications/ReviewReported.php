<?php

namespace App\Notifications;

use App\Models\Review;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

/**
 * Tells admins an owner reported a review, so they can hide it or keep it.
 */
class ReviewReported extends Notification implements ShouldQueue
{
    use Queueable;

    /** Skip quietly if the booking, car or invoice was deleted before it sent. */
    public bool $deleteWhenMissingModels = true;

    public function __construct(public Review $review) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array{action: string, title: string, body: string, url: string}
     */
    public function toArray(object $notifiable): array
    {
        $owner = $this->review->car->owner;

        return [
            'action' => 'review_reported',
            'title' => __('Review reported'),
            'body' => __(':business: :reason', [
                'business' => $owner->storefront->name ?? $owner->name,
                'reason' => $this->review->report_reason,
            ]),
            'url' => route('admin.reviews.index', absolute: false),
        ];
    }
}
