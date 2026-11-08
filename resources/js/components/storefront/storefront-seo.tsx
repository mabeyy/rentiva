import { Head } from '@inertiajs/react';
import { formatPeso } from '@/lib/format';
import { toJsonLd } from '@/lib/json-ld';
import type { Storefront, StorefrontSummary } from '@/types';

/**
 * The page title and AutoRental structured data for a lessor's booking page.
 * The description and link-preview tags are rendered by the server so
 * Facebook and Messenger see them (StorefrontController::storefrontMeta).
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

    const mainLocation = storefront.pickup_locations?.find(
        (location) => location.id === storefront.main_pickup_location_id,
    );

    return (
        <Head title={title}>
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
