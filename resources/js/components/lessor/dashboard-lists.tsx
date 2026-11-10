import { Link, usePage } from '@inertiajs/react';
import {
    addDays,
    format,
    isSameDay,
    parseISO,
    differenceInCalendarDays,
} from 'date-fns';
import type { LucideIcon } from 'lucide-react';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { BookingStatusActions } from '@/components/bookings/booking-status-actions';
import { formatPeso } from '@/lib/format';
import { cn } from '@/lib/utils';
import lessor from '@/routes/lessor';
import type { Booking, Storefront } from '@/types';

export type AgendaEvent = {
    type: 'pickup' | 'return';
    date: string;
    booking: Booking;
};

/** A titled block on the dashboard with an optional count and link. */
export function DashboardPanel({
    title,
    count,
    action,
    children,
}: {
    title: string;
    count?: number;
    action?: ReactNode;
    children: ReactNode;
}) {
    return (
        <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 font-display text-lg font-bold tracking-tight">
                    {title}
                    {count !== undefined && count > 0 && (
                        <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-semibold text-brand-foreground tabular-nums">
                            {count}
                        </span>
                    )}
                </h2>
                {action}
            </div>
            {children}
        </section>
    );
}

/** "Nov 10 – 12" when in one month, "Nov 30 – Dec 2" otherwise. */
function shortRange(startDate: string, endDate: string): string {
    const start = parseISO(startDate);
    const end = parseISO(endDate);

    return start.getMonth() === end.getMonth()
        ? `${format(start, 'MMM d')} – ${format(end, 'd')}`
        : `${format(start, 'MMM d')} – ${format(end, 'MMM d')}`;
}

/** "Today", "Tomorrow" or "Wed, Nov 11". */
function dayLabel(date: string): string {
    const day = parseISO(date);
    const today = new Date();

    if (isSameDay(day, today)) {
        return 'Today';
    }

    if (isSameDay(day, addDays(today, 1))) {
        return 'Tomorrow';
    }

    return format(day, 'EEE, MMM d');
}

/** "9:00 AM" from "09:00". */
function clockTime(time: string): string {
    return format(parseISO(`2000-01-01T${time}`), 'h:mm a');
}

/**
 * Booking requests as compact rows: who, which car, when, how much, and
 * the answer buttons right there.
 */
export function RequestList({ bookings }: { bookings: Booking[] }) {
    return (
        <ul className="divide-y overflow-hidden rounded-2xl border bg-background">
            {bookings.map((booking) => (
                <li
                    key={booking.id}
                    className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4"
                >
                    <Link
                        href={lessor.bookings.show(booking.reference)}
                        className="group min-w-0 flex-1 basis-56"
                    >
                        <p className="truncate font-medium group-hover:underline">
                            {booking.renter_name}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">
                            {booking.car?.name} ·{' '}
                            {shortRange(booking.start_date, booking.end_date)} ·{' '}
                            {booking.days} {booking.days === 1 ? 'day' : 'days'}
                        </p>
                    </Link>
                    <p className="font-semibold tabular-nums">
                        {formatPeso(booking.total)}
                    </p>
                    <BookingStatusActions booking={booking} compact />
                </li>
            ))}
        </ul>
    );
}

const eventStyles: Record<
    AgendaEvent['type'],
    { label: string; icon: LucideIcon; className: string }
> = {
    pickup: {
        label: 'Pickup',
        icon: ArrowUpRight,
        className: 'bg-brand/10 text-brand',
    },
    return: {
        label: 'Return',
        icon: ArrowDownLeft,
        className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    },
};

/**
 * The week's pickups and returns, grouped by day, so the owner knows which
 * cars go out and come back.
 */
export function AgendaList({ events }: { events: AgendaEvent[] }) {
    const { storefront } = usePage<{ storefront: Storefront | null }>().props;
    const pickupTime = storefront?.booking_rules?.pickup_time;
    const days = events.reduce<Record<string, AgendaEvent[]>>(
        (grouped, event) => {
            (grouped[event.date] ??= []).push(event);

            return grouped;
        },
        {},
    );

    return (
        <div className="overflow-hidden rounded-2xl border bg-background">
            {Object.entries(days).map(([date, dayEvents]) => (
                <div key={date} className="border-b last:border-b-0">
                    <p className="bg-muted/40 px-4 py-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        {dayLabel(date)}
                    </p>
                    <ul className="divide-y">
                        {dayEvents.map((event) => {
                            const style = eventStyles[event.type];

                            return (
                                <li key={`${event.type}-${event.booking.id}`}>
                                    <Link
                                        href={lessor.bookings.show(
                                            event.booking.reference,
                                        )}
                                        className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
                                    >
                                        <span
                                            className={cn(
                                                'flex size-9 shrink-0 items-center justify-center rounded-xl',
                                                style.className,
                                            )}
                                        >
                                            <style.icon className="size-4" />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm font-medium">
                                                {event.booking.car?.name}
                                            </span>
                                            <span className="block truncate text-xs text-muted-foreground">
                                                {style.label} ·{' '}
                                                {event.booking.renter_name}
                                            </span>
                                        </span>
                                        {event.type === 'pickup' &&
                                            pickupTime && (
                                                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                                                    {clockTime(pickupTime)}
                                                </span>
                                            )}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            ))}
        </div>
    );
}

/**
 * Confirmed trips whose return date has passed, to be marked completed so
 * revenue and reviews follow.
 */
export function ToCloseList({ bookings }: { bookings: Booking[] }) {
    return (
        <ul className="divide-y overflow-hidden rounded-2xl border bg-background">
            {bookings.map((booking) => {
                const daysAgo = differenceInCalendarDays(
                    new Date(),
                    parseISO(booking.end_date),
                );

                return (
                    <li
                        key={booking.id}
                        className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4"
                    >
                        <Link
                            href={lessor.bookings.show(booking.reference)}
                            className="group min-w-0 flex-1 basis-56"
                        >
                            <p className="truncate font-medium group-hover:underline">
                                {booking.car?.name}
                            </p>
                            <p className="truncate text-sm text-muted-foreground">
                                {booking.renter_name} · returned{' '}
                                {daysAgo === 1
                                    ? 'yesterday'
                                    : `${daysAgo} days ago`}
                            </p>
                        </Link>
                        <BookingStatusActions booking={booking} compact />
                    </li>
                );
            })}
        </ul>
    );
}
