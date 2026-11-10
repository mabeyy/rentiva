import { format, parseISO } from 'date-fns';
import { Link } from '@inertiajs/react';
import { ArrowRight, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PublicReview = {
    id: number;
    rating: number;
    comment: string;
    owner_reply: string | null;
    car_name: string;
    renter: string;
    created_at: string | null;
};

export function SmallStars({ rating }: { rating: number }) {
    return (
        <span className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    aria-hidden
                    className={cn(
                        'size-3.5',
                        star <= rating
                            ? 'fill-brand text-brand'
                            : 'text-muted-foreground/30',
                    )}
                />
            ))}
        </span>
    );
}

/** One written review card, with the owner's reply under it. */
export function ReviewCard({
    review,
    showCar = true,
    businessName,
}: {
    review: PublicReview;
    showCar?: boolean;
    businessName: string;
}) {
    return (
        <li className="flex flex-col rounded-3xl border bg-background p-5">
            <SmallStars rating={review.rating} />
            <p className="mt-3 flex-1 leading-relaxed whitespace-pre-line">
                “{review.comment}”
            </p>
            <p className="mt-4 text-sm font-medium">{review.renter}</p>
            <p className="text-xs text-muted-foreground">
                {showCar && `${review.car_name} · `}
                {review.created_at &&
                    format(parseISO(review.created_at), 'MMMM yyyy')}
            </p>
            {review.owner_reply && (
                <div className="mt-4 rounded-2xl bg-muted/50 p-3 text-sm">
                    <p className="text-xs font-semibold text-muted-foreground">
                        Reply from {businessName}
                    </p>
                    <p className="mt-1 whitespace-pre-line">
                        {review.owner_reply}
                    </p>
                </div>
            )}
        </li>
    );
}

/**
 * The latest written reviews on a booking or car page, under a heading with
 * the average rating, and a link to every review when there are more.
 */
export function PublicReviews({
    reviews,
    title = 'What renters say',
    average,
    ratingCount,
    writtenCount,
    allReviewsHref,
    showCar = true,
    businessName,
}: {
    reviews: PublicReview[];
    title?: string;
    /** Average of every rating, written or not. */
    average: number | null;
    ratingCount: number;
    /** How many reviews have a comment; "See all" shows when it's more than are listed. */
    writtenCount: number;
    allReviewsHref: string;
    showCar?: boolean;
    businessName: string;
}) {
    if (reviews.length === 0) {
        return null;
    }

    return (
        <section className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
                <div>
                    <h2 className="font-display text-2xl font-bold tracking-tight">
                        {title}
                    </h2>
                    {average !== null && (
                        <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                            <Star className="size-4 fill-brand text-brand" />
                            <span className="font-semibold text-foreground tabular-nums">
                                {average.toFixed(1)}
                            </span>
                            from {ratingCount}{' '}
                            {ratingCount === 1 ? 'rating' : 'ratings'}
                        </p>
                    )}
                </div>
                {writtenCount > reviews.length && (
                    <Link
                        href={allReviewsHref}
                        className="flex items-center gap-1 text-sm font-medium text-brand hover:underline"
                    >
                        See all {writtenCount} reviews
                        <ArrowRight className="size-4" />
                    </Link>
                )}
            </div>
            <ul className="grid gap-4 md:grid-cols-3">
                {reviews.map((review) => (
                    <ReviewCard
                        key={review.id}
                        review={review}
                        showCar={showCar}
                        businessName={businessName}
                    />
                ))}
            </ul>
        </section>
    );
}
