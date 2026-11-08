import { Head } from '@inertiajs/react';
import { formatPeso } from '@/lib/format';
import { toJsonLd } from '@/lib/json-ld';
import type { Storefront, StorefrontSummary } from '@/types';

/**
 * Title, meta description, Open Graph tags and AutoRental structured data
 * so each lessor's booking page is shareable and indexable on its own.
 */
export function StorefrontSeo({
    storefront,
    summary,
}: {
    storefront: Storefront;
    summary: StorefrontSummary;
}) {
    const place = storefront.city ? ` in ${storefront.city}` : '';
    const title = `${storefront.name} | Car Rental${place} | Book Online`;
    const priceFrom =
        summary.lowestDailyRate !== null
            ? ` from ${formatPeso(summary.lowestDailyRate)}/day`
            : '';
    const types =
        summary.bodyTypes.length > 0
            ? ` including ${summary.bodyTypes.slice(0, 3).join(', ')}`
            : '';
    const description = `Rent a car from ${storefront.name}${place}${priceFrom}. ${summary.vehicleCount} vehicles${types}. Book online in minutes.`;

    const mainLocation = storefront.pickup_locations?.find(
        (location) => location.id === storefront.main_pickup_location_id,
    );

    return (
        <Head title={title}>
            <meta
                head-key="description"
                name="description"
                content={description}
            />
            <meta head-key="og:title" property="og:title" content={title} />
            <meta
                head-key="og:description"
                property="og:description"
                content={description}
            />
            <meta
                head-key="og:url"
                property="og:url"
                content={storefront.url}
            />
            <meta head-key="og:type" property="og:type" content="website" />
            {storefront.logo_url && (
                <meta
                    head-key="og:image"
                    property="og:image"
                    content={storefront.logo_url}
                />
            )}
            <script head-key="storefront-jsonld" type="application/ld+json">
                {toJsonLd({
                    '@context': 'https://schema.org',
                    '@type': 'AutoRental',
                    name: storefront.name,
                    url: storefront.url,
                    ...(storefront.logo_url && { logo: storefront.logo_url }),
                    ...(storefront.phone && { telephone: storefront.phone }),
                    address: {
                        '@type': 'PostalAddress',
                        ...(storefront.city && {
                            addressLocality: storefront.city,
                        }),
                        ...(mainLocation && {
                            streetAddress: mainLocation.address,
                        }),
                        addressCountry: 'PH',
                    },
                    ...(priceFrom && {
                        priceRange: `From ${formatPeso(summary.lowestDailyRate!)}/day`,
                    }),
                    knowsAbout: summary.bodyTypes,
                })}
            </script>
        </Head>
    );
}
