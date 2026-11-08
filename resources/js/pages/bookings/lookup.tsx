import { Head, Link } from '@inertiajs/react';
import { Mail } from 'lucide-react';
import { BookingLookupForm } from '@/components/bookings/booking-lookup-form';
import { rent } from '@/routes';

/** A sketch of the confirmation email, pointing at where the reference lives. */
function ConfirmationEmailHint() {
    return (
        <div
            aria-hidden
            className="w-full max-w-sm -rotate-[1.5deg] rounded-2xl border bg-background p-5 shadow-xl"
        >
            <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Mail className="size-3.5" /> Booking request received
            </p>
            <p className="mt-3 text-sm font-semibold">
                Your RAV4 request is in.
            </p>
            <div className="mt-3 flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2.5 text-sm">
                <span className="text-muted-foreground">Reference</span>
                <span className="rounded-md bg-brand/15 px-2 py-0.5 font-mono font-semibold text-brand ring-2 ring-brand/40">
                    RNT-7KQ2XM
                </span>
            </div>
            <div className="mt-3 space-y-1.5">
                <span className="block h-2 w-full rounded-full bg-muted" />
                <span className="block h-2 w-2/3 rounded-full bg-muted" />
            </div>
        </div>
    );
}

export default function BookingLookup() {
    return (
        <>
            <Head title="Find my booking" />

            <section className="relative overflow-hidden bg-paper">
                <div
                    aria-hidden
                    className="pointer-events-none absolute -top-40 right-[-10%] size-[640px] rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--brand)_24%,transparent),transparent_65%)]"
                />
                <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pt-16 pb-24 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:pt-24">
                    <div className="motion-safe:animate-in motion-safe:duration-700 motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
                        <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase">
                            <span
                                aria-hidden
                                className="h-0.5 w-10 rounded-full bg-brand"
                            />
                            Already booked?
                        </p>
                        <h1 className="mt-6 font-display text-5xl leading-[0.95] font-extrabold tracking-tight text-balance sm:text-6xl">
                            Check on your{' '}
                            <span className="text-brand">trip.</span>
                        </h1>
                        <p className="mt-6 max-w-lg text-lg text-muted-foreground">
                            See whether the owner has confirmed, review your
                            dates and total, or cancel a request. No account
                            needed, just the reference from your confirmation
                            email.
                        </p>
                        <div className="mt-10 hidden sm:block">
                            <ConfirmationEmailHint />
                        </div>
                    </div>

                    <div className="motion-safe:animate-in motion-safe:duration-1000 motion-safe:fade-in motion-safe:slide-in-from-bottom-8">
                        <div className="mx-auto w-full max-w-md rounded-3xl border bg-background p-6 shadow-xl sm:p-8">
                            <h2 className="font-display text-2xl font-bold tracking-tight">
                                Find my booking
                            </h2>
                            <p className="mt-2 mb-6 text-sm text-muted-foreground">
                                Enter your booking reference and the email you
                                booked with.
                            </p>
                            <BookingLookupForm />
                        </div>
                        <p className="mt-6 text-center text-sm text-muted-foreground">
                            Haven't booked yet?{' '}
                            <Link
                                href={rent()}
                                className="font-medium text-foreground underline underline-offset-4"
                            >
                                Find a rental company
                            </Link>
                        </p>
                    </div>
                </div>
            </section>
        </>
    );
}
