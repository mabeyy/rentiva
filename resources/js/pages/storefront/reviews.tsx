import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, MessageSquareText, X } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { PaginationLinks } from '@/components/pagination-links';
import type { PublicReview } from '@/components/storefront/public-reviews';
import { ReviewCard, SmallStars } from '@/components/storefront/public-reviews';
import storefronts from '@/routes/storefronts';
import type { Paginated, Storefront } from '@/types';

type ReviewSummary = {
    count: number;
    average: number | null;
    /** How many ratings gave each star count, keyed 5 down to 1. */
    breakdown: Record<string, number>;
};

/**
 * Every written review for a rental business, or for one of its cars, with
 * the average and how the ratings spread from 5 stars down to 1.
 */
export default function StorefrontReviews({
    storefront,
    car,
    summary,
    reviews,
}: {
    storefront: Storefront;
    /** Set when the list is limited to one car. */
    car: { slug: string; name: string } | null;
    summary: ReviewSummary;
    reviews: Paginated<PublicReview>;
}) {
    const backHref = car
        ? storefronts.cars.show({ storefront: storefront.slug, car: car.slug })
        : storefronts.show(storefront.slug);

    return (
        <>
            <Head
                title={`${car ? `${car.name} reviews` : 'Reviews'} | ${storefront.name}`}
            />

            <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:py-10">
                <Link
                    href={backHref}
                    className="inline-flex items-center gap-1 rounded-full border bg-background px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="size-4" />
                    {car
                        ? `Back to ${car.name}`
                        : `All ${storefront.name} cars`}
                </Link>

                <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
                    <aside className="space-y-5 rounded-3xl border bg-background p-6 lg:sticky lg:top-24">
                        <div>
                            <h1 className="font-display text-2xl font-bold tracking-tight">
                                {car ? `${car.name} reviews` : 'Reviews'}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                From renters who booked with {storefront.name}.
                            </p>
                        </div>

                        {summary.average !== null ? (
                            <div className="flex items-end gap-3">
                                <span className="font-display text-5xl leading-none font-extrabold tracking-tight tabular-nums">
                                    {summary.average.toFixed(1)}
                                </span>
                                <span className="space-y-1 pb-1">
                                    <SmallStars
                                        rating={Math.round(summary.average)}
                                    />
                                    <span className="block text-xs text-muted-foreground">
                                        {summary.count}{' '}
                                        {summary.count === 1
                                            ? 'rating'
                                            : 'ratings'}
                                    </span>
                                </span>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                No ratings yet.
                            </p>
                        )}

                        {summary.count > 0 && (
                            <ul className="space-y-1.5">
                                {[5, 4, 3, 2, 1].map((stars) => {
                                    const total = summary.breakdown[stars] ?? 0;

                                    return (
                                        <li
                                            key={stars}
                                            className="flex items-center gap-3 text-xs"
                                        >
                                            <span className="w-10 text-muted-foreground tabular-nums">
                                                {stars} star
                                            </span>
                                            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                                                <span
                                                    className="block h-full rounded-full bg-brand"
                                                    style={{
                                                        width: `${(total / summary.count) * 100}%`,
                                                    }}
                                                />
                                            </span>
                                            <span className="w-6 text-right font-medium tabular-nums">
                                                {total}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}

                        {car && (
                            <Link
                                href={storefronts.reviews(storefront.slug)}
                                className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium hover:bg-muted/70"
                            >
                                Only {car.name}
                                <X className="size-3.5" />
                                <span className="sr-only">
                                    Show reviews for every car
                                </span>
                            </Link>
                        )}
                    </aside>

                    <div className="space-y-6">
                        {reviews.data.length > 0 ? (
                            <ul className="grid gap-4 md:grid-cols-2">
                                {reviews.data.map((review) => (
                                    <ReviewCard
                                        key={review.id}
                                        review={review}
                                        showCar={!car}
                                        businessName={storefront.name}
                                    />
                                ))}
                            </ul>
                        ) : (
                            <EmptyState
                                icon={MessageSquareText}
                                title="No written reviews yet"
                                description="Reviews show here once renters finish a trip and leave a comment."
                            />
                        )}
                        <PaginationLinks paginated={reviews} />
                    </div>
                </div>
            </div>
        </>
    );
}
