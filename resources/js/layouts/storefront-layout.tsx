import { Link, usePage } from '@inertiajs/react';
import { MapPin, Phone } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { BrandButton } from '@/components/public/brand-button';
import { StorefrontLogo } from '@/components/storefront/storefront-logo';
import { StorefrontSocialLinks } from '@/components/storefront/storefront-social-links';
import { Button } from '@/components/ui/button';
import { useHasScrolled } from '@/hooks/use-has-scrolled';
import { brandColorStyle } from '@/lib/brand-color';
import { cn } from '@/lib/utils';
import { terms } from '@/routes';
import storefronts from '@/routes/storefronts';
import type { Storefront } from '@/types';

function FooterColumn({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <div>
            <h2 className="text-[11px] font-semibold tracking-[0.2em] text-ink-foreground/50 uppercase">
                {title}
            </h2>
            <div className="mt-4 space-y-3 text-sm text-ink-foreground/75">
                {children}
            </div>
        </div>
    );
}

/**
 * Branded shell for a lessor's booking page: their name and logo up top,
 * their contact details below, and only a plain-text platform credit — no
 * links that lead renters away to other owners on the marketplace. The
 * owner's brand color replaces the app's for everything inside.
 */
export default function StorefrontLayout({
    children,
}: {
    children: ReactNode;
}) {
    const { props, component } = usePage<{ storefront: Storefront }>();
    const { storefront, name: platformName } = props;
    const hasScrolled = useHasScrolled();
    /**
     * The fleet page's hero already shows the logo, name and phone, so the
     * header only brings them in once the hero has scrolled away.
     */
    const isHeroPage = component === 'storefront/show';
    const hasScrolledPastHero = useHasScrolled(220);
    const showsHeaderBrand = !isHeroPage || hasScrolledPastHero;
    const place = storefront.city;
    const pickupLocations = storefront.pickup_locations ?? [];
    const brandStyle = brandColorStyle(storefront.brand_color);

    /** Popovers and menus render in a portal outside this tree, so brand the root too. */
    useEffect(() => {
        const root = document.documentElement;
        const entries = Object.entries(
            brandColorStyle(storefront.brand_color) ?? {},
        );

        entries.forEach(([name, value]) => root.style.setProperty(name, value));

        return () =>
            entries.forEach(([name]) => root.style.removeProperty(name));
    }, [storefront.brand_color]);

    return (
        <div
            className="flex min-h-screen flex-col bg-background"
            style={brandStyle}
        >
            <header
                className={cn(
                    'sticky top-0 z-40 border-b border-transparent bg-background/80 backdrop-blur transition-colors',
                    hasScrolled && 'border-border bg-background/90',
                )}
            >
                <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
                    <Link
                        href={storefronts.show(storefront.slug)}
                        aria-hidden={!showsHeaderBrand}
                        tabIndex={showsHeaderBrand ? undefined : -1}
                        className={cn(
                            'flex min-w-0 items-center gap-3 transition-all duration-300',
                            !showsHeaderBrand &&
                                'pointer-events-none -translate-y-1 opacity-0',
                        )}
                    >
                        <StorefrontLogo
                            storefront={storefront}
                            className="size-9"
                        />
                        <span className="truncate font-display text-lg font-extrabold tracking-tight">
                            {storefront.name}
                        </span>
                    </Link>
                    <nav className="ml-auto flex items-center gap-1">
                        <Button
                            variant="ghost"
                            asChild
                            className="hidden rounded-full sm:inline-flex"
                        >
                            <Link href={storefronts.show(storefront.slug)}>
                                Our cars
                            </Link>
                        </Button>
                        <Button
                            variant="ghost"
                            asChild
                            className="rounded-full"
                        >
                            <Link
                                href={storefronts.bookings.lookup(
                                    storefront.slug,
                                )}
                            >
                                Find my booking
                            </Link>
                        </Button>
                        {storefront.phone && showsHeaderBrand && (
                            <BrandButton
                                asChild
                                className="hidden rounded-full px-5 md:inline-flex"
                            >
                                <a href={`tel:${storefront.phone}`}>
                                    <Phone /> Call us
                                </a>
                            </BrandButton>
                        )}
                    </nav>
                </div>
            </header>

            <main className="flex-1">{children}</main>

            <footer className="border-t-4 border-brand bg-ink text-ink-foreground">
                <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <StorefrontLogo
                                storefront={storefront}
                                className="size-10"
                            />
                            <p className="font-display text-xl font-extrabold tracking-tight">
                                {storefront.name}
                            </p>
                        </div>
                        {storefront.tagline && (
                            <p className="max-w-xs text-sm text-ink-foreground/60">
                                {storefront.tagline}
                            </p>
                        )}
                        <StorefrontSocialLinks
                            storefront={storefront}
                            className="pt-3"
                            linkClassName="border-white/15 bg-white/5 text-ink-foreground hover:bg-white/10"
                        />
                    </div>

                    {pickupLocations.length > 0 ? (
                        <FooterColumn title="Pickup locations">
                            {pickupLocations.map((location) => (
                                <p
                                    key={location.id}
                                    className="flex items-start gap-2"
                                >
                                    <MapPin className="mt-0.5 size-4 shrink-0 text-brand" />
                                    <span>
                                        <span className="block text-ink-foreground">
                                            {location.address}
                                        </span>
                                        {location.city}
                                    </span>
                                </p>
                            ))}
                        </FooterColumn>
                    ) : (
                        place && (
                            <FooterColumn title="Visit us">
                                <p className="flex items-start gap-2">
                                    <MapPin className="mt-0.5 size-4 shrink-0 text-brand" />
                                    {place}
                                </p>
                            </FooterColumn>
                        )
                    )}
                    {storefront.phone && (
                        <FooterColumn title="Contact">
                            <a
                                href={`tel:${storefront.phone}`}
                                className="flex items-center gap-2 transition-colors hover:text-ink-foreground"
                            >
                                <Phone className="size-4 shrink-0 text-brand" />
                                {storefront.phone}
                            </a>
                        </FooterColumn>
                    )}

                    <FooterColumn title="Quick links">
                        <Link
                            href={storefronts.show(storefront.slug)}
                            className="block transition-colors hover:text-ink-foreground"
                        >
                            Our cars
                        </Link>
                        <Link
                            href={storefronts.bookings.lookup(storefront.slug)}
                            className="block transition-colors hover:text-ink-foreground"
                        >
                            Find my booking
                        </Link>
                    </FooterColumn>
                </div>

                <div className="border-t border-white/10">
                    <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-ink-foreground/50 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                        <p>
                            © {new Date().getFullYear()} {storefront.name}
                        </p>
                        <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
                            <Link
                                href={storefronts.privacy(storefront.slug)}
                                className="hover:text-ink-foreground"
                            >
                                Privacy notice
                            </Link>
                            <Link
                                href={terms()}
                                className="hover:text-ink-foreground"
                            >
                                Terms
                            </Link>
                            {storefront.show_platform_badge && (
                                <span>Bookings powered by {platformName}</span>
                            )}
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
