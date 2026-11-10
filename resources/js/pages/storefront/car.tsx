import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { CarDetails } from '@/components/cars/car-details';
import type { PublicReview } from '@/components/storefront/public-reviews';
import { PublicReviews } from '@/components/storefront/public-reviews';
import storefronts from '@/routes/storefronts';
import type { BookedRange, Car, Storefront } from '@/types';

export default function StorefrontCar({
    storefront,
    car,
    bookedRanges,
    reviews,
    reviewSummary,
    writtenReviewCount,
}: {
    storefront: Storefront;
    car: Car;
    bookedRanges: BookedRange[];
    reviews: PublicReview[];
    reviewSummary: { count: number; average: number | null };
    writtenReviewCount: number;
}) {
    return (
        <>
            <Head title={`${car.name} | ${storefront.name}`} />

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
                <Link
                    href={storefronts.show(storefront.slug)}
                    className="mb-6 inline-flex items-center gap-1 rounded-full border bg-background px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="size-4" /> All {storefront.name} cars
                </Link>
                <CarDetails car={car} bookedRanges={bookedRanges} />
                {reviews.length > 0 && (
                    <div className="mt-14">
                        <PublicReviews
                            reviews={reviews}
                            title="Reviews of this car"
                            average={reviewSummary.average}
                            ratingCount={reviewSummary.count}
                            writtenCount={writtenReviewCount}
                            allReviewsHref={
                                storefronts.reviews(storefront.slug, {
                                    query: { car: car.slug },
                                }).url
                            }
                            showCar={false}
                            businessName={storefront.name}
                        />
                    </div>
                )}
            </div>
        </>
    );
}
