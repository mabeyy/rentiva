import { addDays, differenceInCalendarDays } from 'date-fns';
import { toIsoDate } from '@/lib/format';
import type { DateRange } from 'react-day-picker';
import type { Booking, Car } from '@/types';

/** Rentals this long or longer get the weekly discount (matches PriceBooking). */
const WEEKLY_DAYS = 7;
/** Rentals this long or longer get the monthly discount instead. */
const MONTHLY_DAYS = 28;

/** A peak (or low) season: both dates included, rate change in percent. */
export type Season = {
    start_date: string;
    end_date: string;
    rate_change: number;
};

/** A rental's price breakdown; amounts are in centavos. */
export type BookingQuote = {
    days: number;
    dailyRate: number;
    subtotal: number;
    discount: number;
    discountPercent: number;
    deliveryFee: number;
    driverFee: number;
    /** Charges added after booking, like a late return. */
    chargesTotal?: number;
    total: number;
    /** Refundable, collected at pickup and not part of the total. */
    securityDeposit: number;
};

/**
 * Price a selected date range the same way the server does: days at the
 * daily rate (the return date isn't charged), less any long-stay discount,
 * plus delivery and a driver when chosen.
 */
export function calculateBookingQuote(
    car: Pick<
        Car,
        | 'daily_rate'
        | 'weekly_discount'
        | 'monthly_discount'
        | 'delivery_fee'
        | 'driver_daily_rate'
        | 'security_deposit'
    >,
    range: DateRange | undefined,
    extras: {
        withDelivery?: boolean;
        withDriver?: boolean;
        seasons?: Season[];
    } = {},
): BookingQuote | null {
    if (!range?.from || !range.to) {
        return null;
    }

    const days = differenceInCalendarDays(range.to, range.from);

    if (days <= 0) {
        return null;
    }

    let subtotal = 0;

    for (let offset = 0; offset < days; offset++) {
        const day = toIsoDate(addDays(range.from, offset));
        const season = extras.seasons?.find(
            (candidate) =>
                candidate.start_date <= day && candidate.end_date >= day,
        );

        subtotal += Math.round(
            (car.daily_rate * (100 + (season?.rate_change ?? 0))) / 100,
        );
    }

    const discountPercent =
        days >= MONTHLY_DAYS && car.monthly_discount > 0
            ? car.monthly_discount
            : days >= WEEKLY_DAYS
              ? car.weekly_discount
              : 0;
    const discount = Math.floor((subtotal * discountPercent) / 100);
    const deliveryFee =
        extras.withDelivery && car.delivery_fee !== null ? car.delivery_fee : 0;
    const driverFee =
        extras.withDriver && car.driver_daily_rate !== null
            ? car.driver_daily_rate * days
            : 0;

    return {
        days,
        dailyRate: car.daily_rate,
        subtotal,
        discount,
        discountPercent,
        deliveryFee,
        driverFee,
        total: subtotal - discount + deliveryFee + driverFee,
        securityDeposit: car.security_deposit,
    };
}

/** The breakdown a booking was saved with. */
export function quoteFromBooking(booking: Booking): BookingQuote {
    return {
        days: booking.days,
        dailyRate: booking.daily_rate,
        subtotal: booking.subtotal,
        discount: booking.discount,
        discountPercent: booking.subtotal
            ? Math.round((booking.discount / booking.subtotal) * 100)
            : 0,
        deliveryFee: booking.delivery_fee,
        driverFee: booking.driver_fee,
        chargesTotal: booking.charges_total,
        total: booking.total,
        securityDeposit: booking.security_deposit,
    };
}

/**
 * Turn an owner's booking rules into the first and last day a renter can
 * pick up, and the shortest rental. The first day is the first whose pickup
 * time is far enough away.
 */
export function bookingWindow(rules: {
    min_days: number;
    notice_hours: number;
    max_advance_days: number;
    pickup_time: string;
}): { earliest: Date; latest: Date; minDays: number } {
    const today = new Date(new Date().setHours(0, 0, 0, 0));
    const cutoff = Date.now() + rules.notice_hours * 3_600_000;
    let earliest = today;

    while (
        new Date(
            `${toIsoDate(earliest)}T${rules.pickup_time}:00+08:00`,
        ).getTime() < cutoff
    ) {
        earliest = addDays(earliest, 1);
    }

    return {
        earliest,
        latest: addDays(today, rules.max_advance_days),
        minDays: rules.min_days,
    };
}
