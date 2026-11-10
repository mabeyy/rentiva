import { Link } from '@inertiajs/react';
import { Check, Copy, ExternalLink, Lock, Store } from 'lucide-react';
import { BrandButton } from '@/components/public/brand-button';
import { Button } from '@/components/ui/button';
import { useClipboard } from '@/hooks/use-clipboard';
import { cn } from '@/lib/utils';
import lessor from '@/routes/lessor';
import type { Storefront } from '@/types';

/** Splits a booking page URL into its muted host and highlighted slug. */
function splitUrl(url: string): { host: string; path: string } {
    const { host, pathname } = new URL(url);

    return { host: `${host}/`, path: pathname.replace(/^\//, '') };
}

function Glow() {
    return (
        <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -bottom-40 size-[420px] rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--brand)_30%,transparent),transparent_65%)]"
        />
    );
}

/**
 * The lessor's shareable booking page link with copy and open actions, in the
 * landing page's dark "one link" style. `stacked` keeps the actions under the
 * link, for narrow columns.
 */
export function StorefrontLinkCard({
    storefront,
    stacked = false,
}: {
    storefront: Storefront | null;
    stacked?: boolean;
}) {
    const [copiedText, copy] = useClipboard();

    if (!storefront) {
        return (
            <section className="relative overflow-hidden rounded-3xl bg-ink p-6 text-ink-foreground sm:p-8">
                <Glow />
                <div
                    className={cn(
                        'relative flex flex-col gap-6',
                        !stacked &&
                            'md:flex-row md:items-center md:justify-between',
                    )}
                >
                    <div className="flex items-start gap-4">
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground">
                            <Store className="size-5" />
                        </span>
                        <div>
                            <h2 className="font-display text-2xl font-bold tracking-tight">
                                Set up your booking page
                            </h2>
                            <p className="mt-1 max-w-md text-ink-foreground/70">
                                Get your own link to share on Facebook,
                                Messenger and your signage.
                            </p>
                        </div>
                    </div>
                    <BrandButton size="lg" className="self-start" asChild>
                        <Link href={lessor.storefront.edit()}>
                            Create booking page
                        </Link>
                    </BrandButton>
                </div>
            </section>
        );
    }

    const { host, path } = splitUrl(storefront.url);
    const isCopied = copiedText === storefront.url;

    return (
        <section className="relative overflow-hidden rounded-3xl bg-ink p-5 text-ink-foreground sm:p-6">
            <Glow />
            <div
                className={cn(
                    'relative flex flex-col gap-4',
                    !stacked &&
                        'lg:flex-row lg:items-center lg:justify-between',
                )}
            >
                <div className="min-w-0">
                    <p className="text-[11px] font-semibold tracking-[0.22em] text-ink-foreground/60 uppercase">
                        Your booking page
                    </p>
                    <p
                        className={cn(
                            'mt-1 flex min-w-0 items-center gap-2 font-display font-bold tracking-tight',
                            stacked ? 'text-lg' : 'text-xl sm:text-2xl',
                        )}
                    >
                        <Lock
                            aria-hidden
                            className="size-4 shrink-0 text-ink-foreground/40"
                        />
                        <span className="truncate">
                            <span className="text-ink-foreground/40">
                                {host}
                            </span>
                            <span className="text-brand">{path}</span>
                        </span>
                    </p>
                    <p className="mt-1 text-sm text-ink-foreground/60">
                        Share it anywhere. Renters see only your cars and book
                        you directly.
                    </p>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                    <BrandButton
                        className="rounded-full px-5"
                        onClick={() => copy(storefront.url)}
                    >
                        {isCopied ? <Check /> : <Copy />}
                        {isCopied ? 'Copied' : 'Copy link'}
                    </BrandButton>
                    <Button
                        variant="ghost"
                        className="rounded-full text-ink-foreground hover:bg-white/10 hover:text-ink-foreground"
                        asChild
                    >
                        <a
                            href={storefront.url}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <ExternalLink /> Open
                        </a>
                    </Button>
                    <Button
                        variant="ghost"
                        className="rounded-full text-ink-foreground hover:bg-white/10 hover:text-ink-foreground"
                        asChild
                    >
                        <Link href={lessor.storefront.edit()}>Customize</Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}
