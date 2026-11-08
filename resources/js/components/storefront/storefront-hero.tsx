import type { LucideIcon } from 'lucide-react';
import { Banknote, CarFront, MapPin, Phone, Star, Tag } from 'lucide-react';
import { useState } from 'react';
import { BrandButton } from '@/components/public/brand-button';
import { StorefrontLogo } from '@/components/storefront/storefront-logo';
import { StorefrontSocialLinks } from '@/components/storefront/storefront-social-links';
import { formatPeso } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Storefront, StorefrontSummary } from '@/types';

/** About text longer than this gets clamped behind a "Read more" toggle. */
const ABOUT_PREVIEW_LENGTH = 180;

type Spec = {
    icon: LucideIcon;
    label: string;
    value: string;
    detail?: string;
    isHighlighted?: boolean;
};

/**
 * Owner header set like a magazine masthead: their logo and name set large
 * with contact actions beside it, then a spec strip that reads like a car's
 * spec sheet. Kept short so the fleet shows above the fold.
 */
export function StorefrontHero({
    storefront,
    summary,
    locations,
}: {
    storefront: Storefront;
    summary: StorefrontSummary;
    /** Distinct pickup locations across the bookable fleet. */
    locations: string[];
}) {
    const [isAboutExpanded, setIsAboutExpanded] = useState(false);
    const isAboutLong = (storefront.about?.length ?? 0) > ABOUT_PREVIEW_LENGTH;
    /** Lead with the owner's own city when cars are picked up there. */
    const mainPickupPlace =
        storefront.city &&
        (locations.length === 0 || locations.includes(storefront.city))
            ? storefront.city
            : (locations[0] ?? 'Philippines');
    const otherPickupPlaces = locations.filter(
        (location) => location !== mainPickupPlace,
    );
    const specs: Spec[] = [
        {
            icon: MapPin,
            label: 'Pickup in',
            value:
                otherPickupPlaces.length > 0
                    ? `${mainPickupPlace} +${otherPickupPlaces.length} more`
                    : mainPickupPlace,
            detail:
                otherPickupPlaces.length > 0
                    ? otherPickupPlaces.join(', ')
                    : (storefront.pickup_locations?.find(
                          (location) => location.city === mainPickupPlace,
                      )?.address ?? undefined),
        },
        {
            icon: CarFront,
            label: 'Fleet',
            value: `${summary.vehicleCount} ${summary.vehicleCount === 1 ? 'vehicle' : 'vehicles'}`,
        },
        {
            icon: Tag,
            label: 'Rates from',
            value:
                summary.lowestDailyRate !== null
                    ? `${formatPeso(summary.lowestDailyRate)}/day`
                    : 'Coming soon',
            isHighlighted: summary.lowestDailyRate !== null,
        },
        summary.averageRating !== null
            ? {
                  icon: Star,
                  label: 'Rating',
                  value: `${summary.averageRating.toFixed(1)} / 5`,
                  detail: `${summary.reviewCount} ${summary.reviewCount === 1 ? 'review' : 'reviews'}`,
              }
            : { icon: Banknote, label: 'Payment', value: 'At pickup' },
    ];

    return (
        <section className="relative bg-background">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-[color-mix(in_oklch,var(--brand)_9%,transparent)] to-transparent"
            />

            <div className="relative mx-auto max-w-7xl px-4 pt-8 pb-8 sm:px-6 lg:pt-12">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div className="flex min-w-0 items-center gap-4 sm:gap-5">
                        <StorefrontLogo
                            storefront={storefront}
                            className="size-16 shrink-0 rounded-2xl text-xl shadow-[0_12px_28px_-12px_var(--brand)] ring-4 ring-background sm:size-20 sm:text-2xl"
                        />
                        <div className="min-w-0">
                            <h1 className="font-display text-4xl leading-[0.95] font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                                {storefront.name}
                            </h1>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 lg:pb-1">
                        <StorefrontSocialLinks storefront={storefront} />
                        {storefront.phone && (
                            <BrandButton
                                className="h-10 rounded-full px-5"
                                asChild
                            >
                                <a href={`tel:${storefront.phone}`}>
                                    <Phone /> {storefront.phone}
                                </a>
                            </BrandButton>
                        )}
                    </div>
                </div>

                {(storefront.tagline || storefront.about) && (
                    <div className="mt-5 max-w-2xl">
                        {storefront.tagline && (
                            <p className="text-lg text-foreground/80">
                                {storefront.tagline}
                            </p>
                        )}
                        {storefront.about && (
                            <div className="mt-1 text-sm text-muted-foreground">
                                <p
                                    className={cn(
                                        'whitespace-pre-line',
                                        !isAboutExpanded && 'line-clamp-2',
                                    )}
                                >
                                    {storefront.about}
                                </p>
                                {isAboutLong && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setIsAboutExpanded(
                                                (isExpanded) => !isExpanded,
                                            )
                                        }
                                        className="mt-1 font-medium text-foreground underline underline-offset-4"
                                    >
                                        {isAboutExpanded
                                            ? 'Show less'
                                            : 'Read more'}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <dl className="mt-7 grid grid-cols-2 gap-y-5 border-t pt-5 md:grid-cols-4">
                    {specs.map(
                        ({
                            icon: Icon,
                            label,
                            value,
                            detail,
                            isHighlighted,
                        }) => (
                            <div
                                key={label}
                                className="min-w-0 px-3 text-center md:border-l md:first:border-l-0"
                            >
                                <dt className="flex items-center justify-center gap-1.5 text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                                    <Icon className="size-3.5 text-brand" />
                                    {label}
                                </dt>
                                <dd
                                    className={cn(
                                        'mt-1 truncate font-display text-xl font-bold tracking-tight',
                                        isHighlighted && 'text-brand',
                                    )}
                                >
                                    {value}
                                </dd>
                                {detail && (
                                    <dd className="truncate text-xs text-muted-foreground">
                                        {detail}
                                    </dd>
                                )}
                            </div>
                        ),
                    )}
                </dl>
            </div>
        </section>
    );
}
