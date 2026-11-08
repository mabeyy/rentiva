import type { CarFilterValues } from '@/components/cars/car-filters';
import { CarFilters, tripDatesQuery } from '@/components/cars/car-filters';
import { CarResults } from '@/components/cars/car-results';
import type { PublicReview } from '@/components/storefront/public-reviews';
import { PublicReviews } from '@/components/storefront/public-reviews';
import { StorefrontHero } from '@/components/storefront/storefront-hero';
import { StorefrontSeo } from '@/components/storefront/storefront-seo';
import storefronts from '@/routes/storefronts';
import type {
    Car,
    CarSpecOptions,
    Paginated,
    Storefront,
    StorefrontSummary,
} from '@/types';

type Props = CarSpecOptions & {
    storefront: Storefront;
    cars: Paginated<Car>;
    summary: StorefrontSummary;
    filters: CarFilterValues;
    locations: string[];
};

export default function StorefrontShow({
    storefront,
    cars,
    summary,
    filters,
    locations,
    reviews,
    ...options
}: Props & { reviews: PublicReview[] }) {
    const route = storefronts.show(storefront.slug);
    const fleetOptions = {
        ...options,
        bodyTypes: options.bodyTypes.filter((bodyType) =>
            summary.bodyTypes.includes(bodyType.label),
        ),
    };

    return (
        <>
            <StorefrontSeo storefront={storefront} summary={summary} />
            <StorefrontHero
                storefront={storefront}
                summary={summary}
                locations={locations}
            />

            <div className="sticky top-16 z-30 border-b bg-background/90 backdrop-blur">
                <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
                    <CarFilters
                        route={route}
                        filters={filters}
                        options={fleetOptions}
                        locations={locations}
                    />
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
                <CarResults
                    title="The fleet"
                    route={route}
                    cars={cars}
                    filters={filters}
                    carHref={(car) =>
                        storefronts.cars.show(
                            { storefront: storefront.slug, car: car.slug },
                            { query: tripDatesQuery(filters) },
                        )
                    }
                />
            </div>

            {reviews.length > 0 && (
                <div className="mx-auto max-w-7xl px-4 pb-14 sm:px-6">
                    <PublicReviews
                        reviews={reviews}
                        businessName={storefront.name}
                    />
                </div>
            )}
        </>
    );
}
