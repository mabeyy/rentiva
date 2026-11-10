import type { LucideIcon } from 'lucide-react';
import { Banknote, BadgeCheck, Clock } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import type { RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { BookingRequestDialog } from '@/components/bookings/booking-request-dialog';
import { BookingSummary } from '@/components/bookings/booking-summary';
import { DateRangePicker } from '@/components/date-range-picker';
import { BrandButton } from '@/components/public/brand-button';
import {
    MAX_BOOKING_DAYS,
    bookingWindow,
    calculateBookingQuote,
} from '@/lib/booking-quote';
import { formatPeso } from '@/lib/format';
import { defaultPaymentMethods, totalLabelFor } from '@/lib/payment';
import type { BookedRange, Car, PaymentMethod, Storefront } from '@/types';

const reassurances: { icon: LucideIcon; label: string }[] = [
    { icon: BadgeCheck, label: "You won't be charged now" },
    { icon: Clock, label: 'The owner answers within 48 hours' },
    { icon: Banknote, label: 'Pay the owner directly, no card needed' },
];

/**
 * Whether the element is still below the screen, i.e. the renter hasn't
 * scrolled down to it yet.
 */
function useIsBelowScreen(element: RefObject<HTMLElement | null>) {
    const [isBelow, setIsBelow] = useState(false);

    useEffect(() => {
        if (!element.current) {
            return;
        }

        const observer = new IntersectionObserver(([entry]) =>
            setIsBelow(
                !entry.isIntersecting && entry.boundingClientRect.top > 0,
            ),
        );
        observer.observe(element.current);

        return () => observer.disconnect();
    }, [element]);

    return isBelow;
}

/**
 * Sticky booking box on a car page: pick dates, see the total, request it.
 * Until dates are picked the main button opens the calendar instead of
 * sitting disabled. On phones, where the box sits below the car details, a
 * bar at the bottom of the screen carries the price and button until the
 * renter scrolls down to it.
 */
export function BookingCard({
    car,
    bookedRanges,
    initialRange,
}: {
    car: Car;
    bookedRanges: BookedRange[];
    initialRange?: DateRange;
}) {
    const [range, setRange] = useState<DateRange | undefined>(initialRange);
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const storefront = usePage<{ storefront?: Storefront }>().props.storefront;
    const quote = calculateBookingQuote(car, range, {
        seasons: storefront?.peak_seasons,
    });
    const paymentMethods = storefront?.payment_methods ?? defaultPaymentMethods;
    const bookingRules = storefront
        ? {
              ...bookingWindow(storefront.booking_rules),
              maxDays: MAX_BOOKING_DAYS,
          }
        : { maxDays: MAX_BOOKING_DAYS };
    const card = useRef<HTMLDivElement>(null);
    const showMobileBar =
        useIsBelowScreen(card) && storefront?.accepting_bookings !== false;

    function proceed(): void {
        if (quote) {
            setIsDialogOpen(true);

            return;
        }

        card.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setIsPickerOpen(true);
    }

    return (
        <div
            ref={card}
            className="space-y-5 rounded-3xl border bg-background p-6 shadow-xl"
        >
            <p>
                <span className="font-display text-3xl font-extrabold tracking-tight tabular-nums">
                    {formatPeso(car.daily_rate)}
                </span>
                <span className="text-muted-foreground"> /day</span>
            </p>

            <DateRangePicker
                variant="split"
                value={range}
                onChange={setRange}
                bookedRanges={bookedRanges}
                rules={bookingRules}
                open={isPickerOpen}
                onOpenChange={setIsPickerOpen}
            />

            {quote && (
                <BookingSummary
                    quote={quote}
                    totalLabel={
                        paymentMethods.length === 1
                            ? totalLabelFor(
                                  paymentMethods[0].value as PaymentMethod,
                              )
                            : 'Total'
                    }
                />
            )}

            {storefront?.accepting_bookings === false ? (
                <p className="rounded-2xl bg-muted/60 p-4 text-center text-sm text-muted-foreground">
                    {storefront.name} isn't taking online bookings right now.
                    {storefront.phone && ` Call ${storefront.phone} to book.`}
                </p>
            ) : (
                <BrandButton
                    className="h-12 w-full rounded-full text-base"
                    size="lg"
                    onClick={proceed}
                >
                    {quote ? 'Request to book' : 'Check availability'}
                </BrandButton>
            )}

            <ul className="space-y-2 border-t border-dashed pt-4 text-sm text-muted-foreground">
                {reassurances.map(({ icon: Icon, label }) => (
                    <li key={label} className="flex items-center gap-2.5">
                        <Icon className="size-4 shrink-0 text-brand" />
                        {label}
                    </li>
                ))}
            </ul>

            {showMobileBar && (
                <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 border-t bg-background/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_-12px_rgb(0_0_0/0.15)] backdrop-blur lg:hidden">
                    <p className="min-w-0">
                        <span className="font-display text-xl font-extrabold tracking-tight tabular-nums">
                            {formatPeso(quote ? quote.total : car.daily_rate)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                            {quote ? ' total' : ' /day'}
                        </span>
                    </p>
                    <BrandButton
                        className="h-11 shrink-0 rounded-full px-6"
                        onClick={proceed}
                    >
                        {quote ? 'Request to book' : 'Check availability'}
                    </BrandButton>
                </div>
            )}

            {quote && range?.from && range.to && (
                <BookingRequestDialog
                    car={car}
                    range={{ from: range.from, to: range.to }}
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                />
            )}
        </div>
    );
}
