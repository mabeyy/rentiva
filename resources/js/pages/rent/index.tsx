import { Head, Link } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import {
    BadgeCheck,
    Banknote,
    Sparkles,
    Store,
    UserRoundX,
} from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { OptionSelect, toOptions } from '@/components/option-select';
import { PaginationLinks } from '@/components/pagination-links';
import { BrandButton } from '@/components/public/brand-button';
import { SearchInput } from '@/components/search-input';
import { StorefrontCard } from '@/components/storefront/storefront-card';
import { Button } from '@/components/ui/button';
import { useQueryFilters } from '@/hooks/use-query-filters';
import { register, rent } from '@/routes';
import type { Paginated, Storefront } from '@/types';

type Filters = { city?: string; search?: string };

const promises: { icon: LucideIcon; label: string }[] = [
    { icon: UserRoundX, label: 'No account needed' },
    { icon: BadgeCheck, label: 'The owner confirms your dates' },
    { icon: Banknote, label: 'Pay at pickup' },
];

export default function RentIndex({
    storefronts,
    featured,
    cities,
    filters,
}: {
    storefronts: Paginated<Storefront>;
    /** Businesses with a top spot, shown above the list when not filtering. */
    featured: Storefront[];
    cities: string[];
    filters: Filters;
}) {
    const { apply, reset } = useQueryFilters(rent(), filters);
    const isFiltered = Boolean(filters.city || filters.search);
    const total = storefronts.meta.total;

    return (
        <>
            <Head title="Rent a car from trusted local rental companies">
                <meta
                    head-key="description"
                    name="description"
                    content="Compare local car rental businesses in the Philippines and book directly with the operator. No account needed, pay at pickup."
                />
            </Head>

            <section className="relative overflow-hidden bg-paper">
                <div
                    aria-hidden
                    className="pointer-events-none absolute -top-48 right-[-10%] size-[720px] rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--brand)_24%,transparent),transparent_65%)]"
                />
                <div className="relative mx-auto max-w-7xl px-4 pt-16 pb-14 sm:px-6 lg:pt-20">
                    <div className="max-w-3xl motion-safe:animate-in motion-safe:duration-700 motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
                        <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase">
                            <span
                                aria-hidden
                                className="h-0.5 w-10 rounded-full bg-brand"
                            />
                            For renters
                        </p>
                        <h1 className="mt-6 font-display text-5xl leading-[0.95] font-extrabold tracking-tight text-balance sm:text-6xl">
                            Rent straight from the{' '}
                            <span className="text-brand">owner.</span>
                        </h1>
                        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
                            Pick a local rental company, choose your car and
                            dates on their page, and book directly with them.
                        </p>
                        <ul className="mt-6 flex flex-wrap gap-2">
                            {promises.map(({ icon: Icon, label }) => (
                                <li
                                    key={label}
                                    className="flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-sm font-medium"
                                >
                                    <Icon className="size-4 text-brand" />
                                    {label}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="mt-10 flex flex-col gap-3 rounded-3xl border bg-background p-3 shadow-xl sm:flex-row sm:items-center">
                        <div className="sm:w-56 sm:shrink-0">
                            <OptionSelect
                                options={toOptions(cities)}
                                value={filters.city ?? null}
                                onChange={(city) => apply({ city })}
                                anyLabel="All cities"
                                placeholder="All cities"
                            />
                        </div>
                        <SearchInput
                            value={filters.search}
                            onSearch={(search) => apply({ search })}
                            placeholder="Search rental companies"
                            className="max-w-none flex-1"
                        />
                    </div>
                </div>
            </section>

            <section className="bg-background">
                <div className="mx-auto max-w-7xl space-y-8 px-4 py-14 sm:px-6">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                            {total} rental{' '}
                            {total === 1 ? 'company' : 'companies'}
                            {filters.city && (
                                <span className="text-muted-foreground">
                                    {' '}
                                    in {filters.city}
                                </span>
                            )}
                        </h2>
                        {isFiltered && (
                            <Button variant="ghost" size="sm" onClick={reset}>
                                Clear filters
                            </Button>
                        )}
                    </div>

                    {!isFiltered && featured.length > 0 && (
                        <div className="mb-8 rounded-3xl border border-brand/30 bg-brand/5 p-4 sm:p-5">
                            <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-brand">
                                <Sparkles className="size-4" /> Featured rental
                                companies
                            </p>
                            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                {featured.map((storefront) => (
                                    <StorefrontCard
                                        key={storefront.id}
                                        storefront={storefront}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {storefronts.data.length > 0 ? (
                        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {storefronts.data.map((storefront) => (
                                <StorefrontCard
                                    key={storefront.id}
                                    storefront={storefront}
                                />
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon={Store}
                            title="No rental companies found"
                            description="Try another city or search term."
                        />
                    )}

                    <PaginationLinks paginated={storefronts} />
                </div>
            </section>

            <section className="bg-background px-4 pb-16 sm:px-6">
                <div className="relative mx-auto flex max-w-7xl flex-col gap-6 overflow-hidden rounded-[2rem] bg-ink px-8 py-12 text-ink-foreground sm:px-14 md:flex-row md:items-center md:justify-between">
                    <div
                        aria-hidden
                        className="absolute -right-24 -bottom-40 size-[440px] rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--brand)_30%,transparent),transparent_65%)]"
                    />
                    <div className="relative">
                        <h2 className="font-display text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
                            Run a rental business?
                        </h2>
                        <p className="mt-2 max-w-md text-ink-foreground/70">
                            Get your own booking page and list your cars here
                            too.
                        </p>
                    </div>
                    <BrandButton
                        size="lg"
                        className="relative h-12 self-start px-7 text-base md:self-auto"
                        asChild
                    >
                        <Link href={register()}>Create your booking page</Link>
                    </BrandButton>
                </div>
            </section>
        </>
    );
}
