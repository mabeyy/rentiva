import { Link } from '@inertiajs/react';
import { BellRing, Copy } from 'lucide-react';
import { BookingPageMockup } from '@/components/landing/booking-page-mockup';
import { BrandButton } from '@/components/public/brand-button';
import { HandUnderline } from '@/components/public/hand-underline';
import { Button } from '@/components/ui/button';
import { register, rent } from '@/routes';

export function HeroSection({ appHost }: { appHost: string }) {
    return (
        <section className="relative overflow-hidden bg-paper">
            <div
                aria-hidden
                className="pointer-events-none absolute -top-40 right-[-10%] size-[720px] rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--brand)_28%,transparent),transparent_65%)]"
            />
            <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-4 pt-16 pb-24 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:pt-24">
                <div className="motion-safe:animate-in motion-safe:duration-700 motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
                    <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase">
                        <span
                            aria-hidden
                            className="h-0.5 w-10 rounded-full bg-brand"
                        />
                        For car rental owners in the Philippines
                    </p>
                    <h1 className="mt-6 font-display text-5xl leading-[0.95] font-extrabold tracking-tight text-balance sm:text-6xl lg:text-7xl">
                        Stop taking bookings in the{' '}
                        <span className="relative inline-block text-brand">
                            comment section.
                            <HandUnderline />
                        </span>
                    </h1>
                    <p className="mt-8 max-w-xl text-lg text-muted-foreground">
                        Give your rental business its own booking page. Renters
                        see only your cars, check your calendar and send a
                        request. You tap confirm. They pay you at pickup.
                    </p>
                    <div className="mt-10 flex flex-wrap gap-3">
                        <BrandButton
                            size="lg"
                            className="h-12 px-7 text-base"
                            asChild
                        >
                            <Link href={register()}>
                                Create your booking page
                            </Link>
                        </BrandButton>
                        <Button
                            size="lg"
                            variant="ghost"
                            className="h-12 px-5 text-base"
                            asChild
                        >
                            <Link href={rent()}>See live pages →</Link>
                        </Button>
                    </div>
                </div>

                <div className="relative mx-auto motion-safe:animate-in motion-safe:duration-1000 motion-safe:fade-in motion-safe:slide-in-from-bottom-8">
                    <div className="rotate-[2deg]">
                        <BookingPageMockup />
                    </div>

                    <div
                        aria-hidden
                        className="absolute top-24 -left-36 hidden w-64 -rotate-[4deg] rounded-2xl border bg-background p-4 shadow-xl sm:block"
                    >
                        <p className="flex items-center gap-2 text-xs font-medium text-brand">
                            <BellRing className="size-3.5" /> New booking
                            request
                        </p>
                        <p className="mt-2 font-semibold">Juan Dela Cruz</p>
                        <p className="text-sm text-muted-foreground">
                            RAV4 · Nov 14 – 17 · ₱10,500
                        </p>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-semibold">
                            <span className="rounded-lg bg-brand py-1.5 text-center text-brand-foreground">
                                Confirm
                            </span>
                            <span className="rounded-lg border py-1.5 text-center">
                                Decline
                            </span>
                        </div>
                    </div>

                    <div
                        aria-hidden
                        className="absolute -right-10 bottom-16 hidden items-center gap-2 rounded-full bg-ink py-2 pr-2 pl-4 text-sm text-ink-foreground shadow-xl sm:flex"
                    >
                        <span className="font-mono">
                            {appHost}/
                            <span className="text-brand">abqcarrental</span>
                        </span>
                        <span className="flex size-7 items-center justify-center rounded-full bg-white/10">
                            <Copy className="size-3.5" />
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}
