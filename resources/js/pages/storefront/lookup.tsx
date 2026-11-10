import { Head, usePage } from '@inertiajs/react';
import { BookingLookupForm } from '@/components/bookings/booking-lookup-form';
import type { Storefront } from '@/types';

/**
 * "Find my booking" inside an owner's branding; the storefront layout supplies the header.
 */
export default function StorefrontBookingLookup() {
    const { storefront } = usePage<{ storefront: Storefront }>().props;

    return (
        <>
            <Head title="Find my booking" />

            <section className="relative overflow-hidden bg-paper">
                <div
                    aria-hidden
                    className="pointer-events-none absolute -top-40 right-[-10%] size-[560px] rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--brand)_24%,transparent),transparent_65%)]"
                />
                <div className="relative mx-auto flex max-w-xl flex-col items-center px-4 pt-16 pb-24 text-center motion-safe:animate-in motion-safe:duration-700 motion-safe:fade-in motion-safe:slide-in-from-bottom-4 sm:px-6">
                    <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase">
                        <span
                            aria-hidden
                            className="h-0.5 w-10 rounded-full bg-brand"
                        />
                        Already booked with {storefront.name}?
                    </p>
                    <h1 className="mt-5 font-display text-5xl leading-[0.95] font-extrabold tracking-tight text-balance">
                        Check on your <span className="text-brand">trip.</span>
                    </h1>
                    <p className="mt-5 text-lg text-muted-foreground">
                        Enter the reference from your confirmation email and the
                        email you booked with.
                    </p>
                    <div className="mt-10 w-full rounded-3xl border bg-background p-6 text-left shadow-xl sm:p-8">
                        <BookingLookupForm />
                    </div>
                </div>
            </section>
        </>
    );
}
