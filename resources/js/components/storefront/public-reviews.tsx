import { format, parseISO } from 'date-fns';
import { Star } from 'lucide-react';
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

function SmallStars({ rating }: { rating: number }) {
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

/**
 * Recent written reviews on a booking page, with the owner's replies.
 */
export function PublicReviews({
    reviews,
    title = 'What renters say',
    showCar = true,
    businessName,
}: {
    reviews: PublicReview[];
    title?: string;
    showCar?: boolean;
    businessName: string;
}) {
    if (reviews.length === 0) {
        return null;
    }

    return (
        <section className="space-y-5">
            <h2 className="font-display text-2xl font-bold tracking-tight">
                {title}
            </h2>
            <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {reviews.map((review) => (
                    <li
                        key={review.id}
                        className="flex flex-col rounded-3xl border bg-background p-5"
                    >
                        <SmallStars rating={review.rating} />
                        <p className="mt-3 flex-1 leading-relaxed whitespace-pre-line">
                            “{review.comment}”
                        </p>
                        <p className="mt-4 text-sm font-medium">
                            {review.renter}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {showCar && `${review.car_name} · `}
                            {review.created_at &&
                                format(
                                    parseISO(review.created_at),
                                    'MMMM yyyy',
                                )}
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
                ))}
            </ul>
        </section>
    );
}
