import { Link } from '@inertiajs/react';
import { ArrowRight, CarFront, MapPin, Sparkles } from 'lucide-react';
import { StorefrontLogo } from '@/components/storefront/storefront-logo';
import { formatPeso } from '@/lib/format';
import { cn } from '@/lib/utils';
import storefronts from '@/routes/storefronts';
import type { Storefront } from '@/types';

/**
 * A rental business in the renter directory, linking to its own booking page.
 */
export function StorefrontCard({ storefront }: { storefront: Storefront }) {
    const lowestRate = storefront.lowest_daily_rate;

    return (
        <Link
            href={storefronts.show(storefront.slug)}
            prefetch
            className={cn(
                'group relative flex flex-col gap-5 rounded-3xl border bg-background p-6 transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none',
                storefront.is_featured &&
                    'border-brand/50 ring-1 ring-brand/30',
            )}
        >
            {storefront.is_featured && (
                <span className="absolute top-4 right-4 inline-flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
                    <Sparkles className="size-3" /> Featured
                </span>
            )}
            <div className="flex items-center gap-3">
                <StorefrontLogo storefront={storefront} className="size-12" />
                <div className="min-w-0">
                    <h3 className="truncate font-display text-lg font-bold tracking-tight">
                        {storefront.name}
                    </h3>
                    {storefront.city && (
                        <p className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="size-3.5" /> {storefront.city}
                        </p>
                    )}
                </div>
            </div>

            {storefront.tagline && (
                <p className="line-clamp-2 text-sm text-muted-foreground">
                    {storefront.tagline}
                </p>
            )}

            {storefront.body_types && storefront.body_types.length > 0 && (
                <ul className="flex flex-wrap gap-1.5">
                    {storefront.body_types.map((bodyType) => (
                        <li
                            key={bodyType}
                            className="rounded-full bg-muted/60 px-2.5 py-1 text-xs font-medium text-muted-foreground"
                        >
                            {bodyType}
                        </li>
                    ))}
                </ul>
            )}

            <div className="mt-auto flex items-end justify-between gap-3 border-t border-dashed pt-4">
                <div>
                    {lowestRate !== undefined && lowestRate !== null && (
                        <p className="text-sm text-muted-foreground">
                            from{' '}
                            <span className="font-display text-xl font-extrabold text-foreground tabular-nums">
                                {formatPeso(lowestRate)}
                            </span>
                            /day
                        </p>
                    )}
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CarFront className="size-3.5" />{' '}
                        {storefront.vehicle_count}{' '}
                        {storefront.vehicle_count === 1
                            ? 'vehicle'
                            : 'vehicles'}
                    </p>
                </div>
                <span className="flex items-center gap-1 text-sm font-semibold text-brand">
                    View cars
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
            </div>
        </Link>
    );
}
