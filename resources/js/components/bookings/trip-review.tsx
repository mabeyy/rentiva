import { Form } from '@inertiajs/react';
import { Star } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { BrandButton } from '@/components/public/brand-button';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export type TripReview = {
    rating: number;
    comment: string | null;
    /** The owner's answer, shown under the review. */
    owner_reply?: string | null;
};

const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

export function Stars({
    rating,
    className,
}: {
    rating: number;
    className?: string;
}) {
    return (
        <span
            className={cn('flex gap-0.5', className)}
            aria-label={`${rating} out of 5 stars`}
        >
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    aria-hidden
                    className={cn(
                        'size-5',
                        star <= rating
                            ? 'fill-brand text-brand'
                            : 'text-muted-foreground/30',
                    )}
                />
            ))}
        </span>
    );
}

/**
 * Rate a completed trip (when `reviewUrl` is set) or show the rating given.
 */
export function TripReviewCard({
    review,
    reviewUrl,
}: {
    review: TripReview | null;
    reviewUrl: string | null;
}) {
    const [rating, setRating] = useState(0);
    const [hovered, setHovered] = useState(0);
    const shownRating = hovered || rating;

    if (review) {
        return (
            <section className="rounded-3xl border p-6">
                <h2 className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                    Your review
                </h2>
                <Stars rating={review.rating} className="mt-3" />
                {review.comment && (
                    <p className="mt-3 whitespace-pre-line text-foreground/85">
                        “{review.comment}”
                    </p>
                )}
                {review.owner_reply && (
                    <div className="mt-4 rounded-2xl bg-muted/50 p-4">
                        <p className="text-xs font-semibold text-muted-foreground">
                            Reply from the owner
                        </p>
                        <p className="mt-1 text-sm whitespace-pre-line">
                            {review.owner_reply}
                        </p>
                    </div>
                )}
            </section>
        );
    }

    if (!reviewUrl) {
        return null;
    }

    return (
        <section className="rounded-3xl border border-brand/30 bg-[color-mix(in_srgb,var(--brand)_5%,var(--background))] p-6">
            <h2 className="font-display text-2xl font-bold tracking-tight">
                How was your trip?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
                Your rating helps other renters choose, and helps the owner
                improve.
            </p>

            <Form
                action={reviewUrl}
                method="post"
                options={{ preserveScroll: true }}
                className="mt-5 space-y-4"
            >
                {({ processing, errors }) => (
                    <>
                        <input type="hidden" name="rating" value={rating} />
                        <div className="flex flex-wrap items-center gap-3">
                            <div
                                role="radiogroup"
                                aria-label="Rating"
                                className="flex gap-1"
                                onMouseLeave={() => setHovered(0)}
                            >
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        role="radio"
                                        aria-checked={rating === star}
                                        aria-label={`${star} star${star === 1 ? '' : 's'}`}
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHovered(star)}
                                        className="rounded-md p-0.5 transition-transform outline-none hover:scale-110 focus-visible:ring-2 focus-visible:ring-brand"
                                    >
                                        <Star
                                            aria-hidden
                                            className={cn(
                                                'size-8 transition-colors',
                                                star <= shownRating
                                                    ? 'fill-brand text-brand'
                                                    : 'text-muted-foreground/40',
                                            )}
                                        />
                                    </button>
                                ))}
                            </div>
                            <span className="text-sm font-medium text-muted-foreground">
                                {ratingLabels[shownRating]}
                            </span>
                        </div>
                        <InputError message={errors.rating} />

                        <Textarea
                            name="comment"
                            rows={3}
                            maxLength={1000}
                            placeholder="What stood out? The car, pickup, the owner… (optional)"
                            className="bg-background"
                        />
                        <InputError message={errors.comment} />

                        <BrandButton
                            type="submit"
                            className="rounded-full px-6"
                            disabled={processing || rating === 0}
                        >
                            {processing && <Spinner />}
                            Submit review
                        </BrandButton>
                    </>
                )}
            </Form>
        </section>
    );
}
