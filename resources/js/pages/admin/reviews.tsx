import { Head, router } from '@inertiajs/react';
import { EyeOff, Flag, RotateCcw, ShieldCheck } from 'lucide-react';
import { Stars } from '@/components/bookings/trip-review';
import { EmptyState } from '@/components/empty-state';
import Heading from '@/components/heading';
import { PaginationLinks } from '@/components/pagination-links';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQueryFilters } from '@/hooks/use-query-filters';
import admin from '@/routes/admin';
import type { Paginated } from '@/types';
import { TimeAgo } from '@/components/time-ago';

type ModeratedReview = {
    id: number;
    rating: number;
    comment: string | null;
    owner_reply: string | null;
    report_reason: string | null;
    renter_name: string;
    reference: string;
    car_name: string;
    business: string;
    created_at: string | null;
    is_hidden: boolean;
};

function decide(reviewId: number, decision: 'hide' | 'keep' | 'show'): void {
    router.put(
        admin.reviews.update(reviewId).url,
        { decision },
        { preserveScroll: true },
    );
}

function ReviewCard({ review }: { review: ModeratedReview }) {
    return (
        <li className="space-y-3 rounded-2xl border bg-background p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="font-medium">{review.business}</p>
                    <p className="text-sm text-muted-foreground">
                        {review.renter_name} · {review.car_name} ·{' '}
                        <span className="font-mono">{review.reference}</span>
                    </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Stars
                        rating={review.rating}
                        className="[&_svg]:size-3.5"
                    />
                    {review.created_at && <TimeAgo date={review.created_at} />}
                </div>
            </div>

            <p className="text-sm whitespace-pre-line">
                {review.comment ?? (
                    <span className="text-muted-foreground italic">
                        Rated without a comment.
                    </span>
                )}
            </p>
            {review.owner_reply && (
                <p className="border-l-2 pl-3 text-sm text-muted-foreground">
                    Owner's reply: {review.owner_reply}
                </p>
            )}
            {review.report_reason && (
                <p className="flex gap-2 rounded-xl bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-300">
                    <Flag className="mt-0.5 size-4 shrink-0" />
                    <span>
                        <strong>Reported by the owner:</strong>{' '}
                        {review.report_reason}
                    </span>
                </p>
            )}

            <div className="flex flex-wrap justify-end gap-2 border-t pt-3">
                {review.is_hidden ? (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => decide(review.id, 'show')}
                    >
                        <RotateCcw /> Show again
                    </Button>
                ) : (
                    <>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => decide(review.id, 'keep')}
                        >
                            <ShieldCheck /> Keep it up
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => decide(review.id, 'hide')}
                        >
                            <EyeOff /> Hide review
                        </Button>
                    </>
                )}
            </div>
        </li>
    );
}

/**
 * Reviews owners reported. Hide ones that are abusive, share personal
 * details, are fake or aren't about the business; keep fair criticism.
 */
export default function AdminReviews({
    reviews,
    status,
    counts,
}: {
    reviews: Paginated<ModeratedReview>;
    status: 'reported' | 'hidden';
    counts: { reported: number; hidden: number };
}) {
    const { apply } = useQueryFilters(admin.reviews.index(), { status });

    return (
        <>
            <Head title="Reviews" />

            <div className="space-y-6 p-4 md:p-6">
                <Heading
                    title="Reviews"
                    description="Reviews owners reported. Hide ones that are abusive, share personal details, are fake or aren't about the business. Keep fair criticism, even harsh."
                />

                <Tabs
                    value={status}
                    onValueChange={(value) =>
                        apply({ status: value === 'reported' ? null : value })
                    }
                >
                    <TabsList>
                        <TabsTrigger value="reported">
                            Reported ({counts.reported})
                        </TabsTrigger>
                        <TabsTrigger value="hidden">
                            Hidden ({counts.hidden})
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                {reviews.data.length > 0 ? (
                    <ul className="space-y-3">
                        {reviews.data.map((review) => (
                            <ReviewCard key={review.id} review={review} />
                        ))}
                    </ul>
                ) : (
                    <EmptyState
                        icon={Flag}
                        title={
                            status === 'reported'
                                ? 'Nothing reported'
                                : 'No hidden reviews'
                        }
                        description={
                            status === 'reported'
                                ? 'Reviews owners report show up here.'
                                : 'Reviews you hide show up here, and can be shown again.'
                        }
                    />
                )}

                <PaginationLinks paginated={reviews} />
            </div>
        </>
    );
}

AdminReviews.layout = {
    breadcrumbs: [{ title: 'Reviews', href: admin.reviews.index() }],
};
