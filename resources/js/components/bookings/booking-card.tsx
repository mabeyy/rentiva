import type { LucideIcon } from 'lucide-react';
import { Banknote, BadgeCheck, Clock } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import { useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { BookingRequestDialog } from '@/components/bookings/booking-request-dialog';
import { BookingSummary } from '@/components/bookings/booking-summary';
import { DateRangePicker } from '@/components/date-range-picker';
import { BrandButton } from '@/components/public/brand-button';
import { bookingWindow, calculateBookingQuote } from '@/lib/booking-quote';
import { formatPeso } from '@/lib/format';
import { defaultPaymentMethods, totalLabelFor } from '@/lib/payment';
import type { BookedRange, Car, PaymentMethod, Storefront } from '@/types';

const reassurances: { icon: LucideIcon; label: string }[] = [
    { icon: BadgeCheck, label: "You won't be charged now" },
    { icon: Clock, label: 'The owner confirms within 24 hours' },
    { icon: Banknote, label: 'Pay the owner directly, no card needed' },
];

/**
 * Sticky booking box on a car page: pick dates, see the total, request it.
 * Until dates are picked the main button opens the calendar instead of
 * sitting disabled.
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
        ? bookingWindow(storefront.booking_rules)
        : undefined;

    return (
        <div className="space-y-5 rounded-3xl border bg-background p-6 shadow-xl">
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
                    onClick={() =>
                        quote ? setIsDialogOpen(true) : setIsPickerOpen(true)
                    }
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
