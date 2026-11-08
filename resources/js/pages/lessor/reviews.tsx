import { Head, Link } from '@inertiajs/react';
import { formatDistanceToNowStrict, parseISO } from 'date-fns';
import { MessageSquare, Star, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { ReviewReplyForm } from '@/components/bookings/review-reply-form';
import { Stars } from '@/components/bookings/trip-review';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/lessor/page-header';
import { OptionSelect } from '@/components/option-select';
import { PaginationLinks } from '@/components/pagination-links';
import { useQueryFilters } from '@/hooks/use-query-filters';
import { cn } from '@/lib/utils';
import lessor from '@/routes/lessor';
import type { Paginated } from '@/types';

type OwnerReview = {
    id: number;
    rating: number;
    comment: string | null;
    owner_reply: string | null;
    created_at: string | null;
    car_name: string;
    renter_name: string;
    reference: string;
};

type ReviewSummary = {
    count: number;
    average: number | null;
    breakdown: Record<string, number>;
    unanswered: number;
};

type ReviewedCar = {
    slug: string;
    name: string;
    count: number;
    average: number;
};

type ReviewFilters = { rating?: string; unanswered?: string; car?: string };

/** e.g. "JD" for "Juan Dela Cruz". */
function initials(name: string): string {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');
}

/** Five stars filled to a fractional rating, e.g. 4.4. */
function StarRating({ value }: { value: number }) {
    return (
        <span
            className="relative flex"
            aria-label={`${value.toFixed(1)} out of 5 stars`}
        >
            <span className="flex gap-0.5 text-muted-foreground/25">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        aria-hidden
                        className="size-5 fill-current"
                    />
                ))}
            </span>
            <span
                className="absolute inset-y-0 left-0 flex gap-0.5 overflow-hidden text-brand"
                style={{ width: `${(value / 5) * 100}%` }}
            >
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        aria-hidden
                        className="size-5 shrink-0 fill-current"
                    />
                ))}
            </span>
        </span>
    );
}

function Chip({
    isActive,
    onClick,
    children,
}: {
    isActive: boolean;
    onClick: () => void;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            aria-pressed={isActive}
            onClick={onClick}
            className={cn(
                'flex h-9 items-center gap-1 rounded-full border px-3.5 text-sm whitespace-nowrap transition-colors',
                isActive
                    ? 'border-ink bg-ink text-ink-foreground'
                    : 'bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground',
            )}
        >
            {children}
        </button>
    );
}

export default function LessorReviews({
    reviews,
    summary,
    cars,
    filters,
}: {
    reviews: Paginated<OwnerReview>;
    summary: ReviewSummary;
    cars: ReviewedCar[];
    filters: ReviewFilters;
}) {
    const { apply } = useQueryFilters(lessor.reviews.index(), filters);
    const activeRating = filters.rating ? Number(filters.rating) : null;
    const isUnansweredOnly = Boolean(Number(filters.unanswered ?? 0));
    const replied = summary.count - summary.unanswered;
    const replyRate = summary.count
        ? Math.round((replied / summary.count) * 100)
        : 0;
    const isFiltered = Boolean(activeRating || isUnansweredOnly || filters.car);

    return (
        <>
            <Head title="Reviews" />

            <div className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-8">
                <PageHeader
                    eyebrow="Your reputation"
                    title="Reviews"
                    description="What renters said after their trip. Your replies show on their booking."
                />

                {summary.count === 0 ? (
                    <EmptyState
                        icon={MessageSquare}
                        title="No reviews yet"
                        description="Renters can review a trip once you mark it completed. Their reviews will show up here."
                    />
                ) : (
                    <div className="grid gap-6 lg:grid-cols-[18rem_1fr] lg:items-start">
                        <aside className="lg:sticky lg:top-4">
                            <section className="divide-y divide-dashed rounded-3xl border bg-background">
                                <div className="p-5">
                                    <div className="flex items-center gap-4">
                                        <p className="font-display text-5xl leading-none font-extrabold tracking-tight tabular-nums">
                                            {summary.average?.toFixed(1)}
                                        </p>
                                        <div>
                                            <StarRating
                                                value={summary.average ?? 0}
                                            />
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                from {summary.count}{' '}
                                                {summary.count === 1
                                                    ? 'review'
                                                    : 'reviews'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 space-y-0.5">
                                        {[5, 4, 3, 2, 1].map((rating) => {
                                            const count =
                                                summary.breakdown[rating] ?? 0;
                                            const isActive =
                                                activeRating === rating;

                                            return (
                                                <button
                                                    key={rating}
                                                    type="button"
                                                    aria-pressed={isActive}
                                                    aria-label={`Show ${rating}-star reviews (${count})`}
                                                    disabled={count === 0}
                                                    onClick={() =>
                                                        apply({
                                                            rating: isActive
                                                                ? null
                                                                : String(
                                                                      rating,
                                                                  ),
                                                        })
                                                    }
                                                    className={cn(
                                                        'flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-xs transition-colors enabled:hover:bg-muted/60 disabled:opacity-40',
                                                        isActive && 'bg-muted',
                                                    )}
                                                >
                                                    <span className="flex w-7 items-center gap-0.5 font-medium tabular-nums">
                                                        {rating}
                                                        <Star className="size-3 fill-current text-muted-foreground/60" />
                                                    </span>
                                                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                                                        <span
                                                            className="block h-full rounded-full bg-brand"
                                                            style={{
                                                                width: `${(count / summary.count) * 100}%`,
                                                            }}
                                                        />
                                                    </span>
                                                    <span className="w-5 text-right text-muted-foreground tabular-nums">
                                                        {count}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="p-5">
                                    <div className="flex items-baseline justify-between gap-2 text-sm">
                                        <span className="font-medium">
                                            Replies
                                        </span>
                                        <span className="text-xs text-muted-foreground tabular-nums">
                                            {replied} of {summary.count}{' '}
                                            answered
                                        </span>
                                    </div>
                                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                                        <span
                                            className="block h-full rounded-full bg-emerald-500"
                                            style={{ width: `${replyRate}%` }}
                                        />
                                    </div>
                                    {summary.unanswered > 0 ? (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                apply({ unanswered: '1' })
                                            }
                                            className="mt-3 text-xs font-medium text-brand hover:underline"
                                        >
                                            Reply to {summary.unanswered}{' '}
                                            waiting →
                                        </button>
                                    ) : (
                                        <p className="mt-3 text-xs text-muted-foreground">
                                            All caught up.
                                        </p>
                                    )}
                                </div>

                                {cars.length > 1 && (
                                    <div className="p-5">
                                        <h2 className="text-sm font-medium">
                                            By car
                                        </h2>
                                        <ul className="-mx-1.5 mt-2 space-y-0.5">
                                            {cars.map((car) => {
                                                const isActive =
                                                    filters.car === car.slug;
                                                const isWeak = car.average < 4;
                                                const year =
                                                    car.name.match(
                                                        /^\d{4}/,
                                                    )?.[0];
                                                const model = car.name.replace(
                                                    /^\d{4}\s+/,
                                                    '',
                                                );

                                                return (
                                                    <li key={car.slug}>
                                                        <button
                                                            type="button"
                                                            aria-pressed={
                                                                isActive
                                                            }
                                                            onClick={() =>
                                                                apply({
                                                                    car: isActive
                                                                        ? null
                                                                        : car.slug,
                                                                })
                                                            }
                                                            className={cn(
                                                                'flex w-full items-center gap-3 rounded-xl px-1.5 py-2 text-left transition-colors hover:bg-muted/60',
                                                                isActive &&
                                                                    'bg-muted',
                                                            )}
                                                        >
                                                            <span className="min-w-0 flex-1">
                                                                <span className="block truncate text-sm font-medium">
                                                                    {model}
                                                                </span>
                                                                <span className="block text-xs text-muted-foreground">
                                                                    {year &&
                                                                        `${year} · `}
                                                                    {car.count}{' '}
                                                                    {car.count ===
                                                                    1
                                                                        ? 'review'
                                                                        : 'reviews'}
                                                                </span>
                                                            </span>
                                                            <span
                                                                className={cn(
                                                                    'flex shrink-0 items-center gap-1 text-sm font-semibold tabular-nums',
                                                                    isWeak &&
                                                                        'text-amber-700 dark:text-amber-400',
                                                                )}
                                                            >
                                                                <Star
                                                                    className={cn(
                                                                        'size-3.5 fill-current',
                                                                        isWeak
                                                                            ? 'text-amber-500'
                                                                            : 'text-brand',
                                                                    )}
                                                                />
                                                                {car.average.toFixed(
                                                                    1,
                                                                )}
                                                            </span>
                                                        </button>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                )}
                            </section>
                        </aside>

                        <div className="min-w-0 space-y-4">
                            <div className="flex flex-wrap items-center gap-2">
                                <Chip
                                    isActive={!isUnansweredOnly}
                                    onClick={() => apply({ unanswered: null })}
                                >
                                    All
                                </Chip>
                                <Chip
                                    isActive={isUnansweredOnly}
                                    onClick={() => apply({ unanswered: '1' })}
                                >
                                    Needs a reply
                                    {summary.unanswered > 0 && (
                                        <span
                                            className={cn(
                                                'ml-1 rounded-full px-1.5 text-[11px] font-semibold tabular-nums',
                                                isUnansweredOnly
                                                    ? 'bg-white/15'
                                                    : 'bg-brand/10 text-brand',
                                            )}
                                        >
                                            {summary.unanswered}
                                        </span>
                                    )}
                                </Chip>
                                {cars.length === 1 ? null : (
                                    <OptionSelect
                                        options={cars.map((car) => ({
                                            value: car.slug,
                                            label: car.name,
                                        }))}
                                        value={filters.car ?? null}
                                        onChange={(car) => apply({ car })}
                                        anyLabel="All cars"
                                        placeholder="All cars"
                                        className="h-9 w-48 rounded-full lg:hidden"
                                    />
                                )}
                                {isFiltered && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            apply({
                                                rating: null,
                                                unanswered: null,
                                                car: null,
                                            })
                                        }
                                        className="ml-auto flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                                    >
                                        <X className="size-3.5" /> Clear filters
                                    </button>
                                )}
                            </div>

                            {reviews.data.length > 0 ? (
                                <ul className="space-y-3">
                                    {reviews.data.map((review) => (
                                        <li
                                            key={review.id}
                                            className="rounded-3xl border bg-background p-5"
                                        >
                                            <div className="flex items-start gap-3">
                                                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                                                    {initials(
                                                        review.renter_name,
                                                    )}
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                                                        <p className="font-semibold">
                                                            {review.renter_name}
                                                        </p>
                                                        {review.created_at && (
                                                            <p className="text-xs text-muted-foreground">
                                                                {formatDistanceToNowStrict(
                                                                    parseISO(
                                                                        review.created_at,
                                                                    ),
                                                                    {
                                                                        addSuffix: true,
                                                                    },
                                                                )}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                                                        <Stars
                                                            rating={
                                                                review.rating
                                                            }
                                                            className="[&_svg]:size-3.5"
                                                        />
                                                        <span>
                                                            {review.car_name}
                                                        </span>
                                                        <span aria-hidden>
                                                            ·
                                                        </span>
                                                        <Link
                                                            href={lessor.bookings.show(
                                                                review.reference,
                                                            )}
                                                            className="font-mono hover:text-foreground hover:underline"
                                                        >
                                                            {review.reference}
                                                        </Link>
                                                    </div>

                                                    {review.comment ? (
                                                        <p className="mt-3 leading-relaxed whitespace-pre-line">
                                                            {review.comment}
                                                        </p>
                                                    ) : (
                                                        <p className="mt-3 text-sm text-muted-foreground italic">
                                                            No written comment.
                                                        </p>
                                                    )}

                                                    <div className="mt-4 border-l-2 border-brand/30 pl-4">
                                                        <ReviewReplyForm
                                                            reviewId={review.id}
                                                            reply={
                                                                review.owner_reply
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <EmptyState
                                    icon={MessageSquare}
                                    title={
                                        isUnansweredOnly
                                            ? "You've replied to every review"
                                            : 'No reviews match'
                                    }
                                    description={
                                        isUnansweredOnly
                                            ? 'Nice work. New reviews that need a reply will show up here.'
                                            : 'Try another rating or car.'
                                    }
                                />
                            )}
                            <PaginationLinks paginated={reviews} />
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

LessorReviews.layout = {
    breadcrumbs: [{ title: 'Reviews', href: lessor.reviews.index() }],
};
