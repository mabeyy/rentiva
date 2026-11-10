import { Head, Link, router } from '@inertiajs/react';
import {
    addDays,
    addMonths,
    format,
    isSameMonth,
    parseISO,
    startOfMonth,
    startOfWeek,
} from 'date-fns';
import type { LucideIcon } from 'lucide-react';
import {
    ArrowDownToLine,
    ArrowUpFromLine,
    CalendarOff,
    CarFront,
    ChevronLeft,
    ChevronDown,
    ChevronRight,
    CircleDot,
    Phone,
    Plus,
    Route,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { Hint, InfoTip } from '@/components/info-tip';
import { BookingPaymentReview } from '@/components/bookings/booking-payment-review';
import { BookingStatusActions } from '@/components/bookings/booking-status-actions';
import type { BlockOptions } from '@/components/bookings/block-dates-dialog';
import {
    BlockDatesDialog,
    blockPeriod,
} from '@/components/bookings/block-dates-dialog';
import { BookingsViewTabs } from '@/components/lessor/bookings-view-tabs';
import { PageHeader } from '@/components/lessor/page-header';
import { Button } from '@/components/ui/button';
import { formatPeso, toIsoDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import lessor from '@/routes/lessor';
import type { Booking, CarBlock } from '@/types';

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** What happens on one day: cars handed over, brought back, or out all day. */
type DayActivity = {
    pickups: Booking[];
    returns: Booking[];
    outOnRent: Booking[];
    pendingCount: number;
};

/**
 * A request the owner hasn't answered shows on its pickup day only: until
 * it's confirmed, no car is actually out or coming back.
 */
function activityOn(day: string, bookings: Booking[]): DayActivity {
    const answered = bookings.filter(
        (booking) => booking.status.value !== 'pending',
    );
    const pickups = bookings.filter((booking) => booking.start_date === day);
    const returns = answered.filter((booking) => booking.end_date === day);
    const outOnRent = answered.filter(
        (booking) => booking.start_date < day && booking.end_date > day,
    );

    return {
        pickups,
        returns,
        outOnRent,
        pendingCount: pickups.filter(
            (booking) => booking.status.value === 'pending',
        ).length,
    };
}

function blocksOn(day: string, blocks: CarBlock[]): CarBlock[] {
    return blocks.filter(
        (block) => block.start_date <= day && block.end_date >= day,
    );
}

/** Diagonal stripes marking days a car is blocked. */
const blockedStripes =
    'bg-[repeating-linear-gradient(135deg,transparent_0_4px,color-mix(in_oklch,var(--muted-foreground)_18%,transparent)_4px_6px)]';

/** A blocked car on the day panel, linking to where the block is managed. */
function BlockRow({ block }: { block: CarBlock }) {
    return (
        <li>
            <Link
                href={lessor.cars.edit(block.car!.slug)}
                className="flex items-center gap-3 rounded-2xl border border-dashed bg-background p-3 transition-colors hover:border-foreground/30"
            >
                <span
                    className={cn(
                        'flex size-10 shrink-0 items-center justify-center rounded-xl border text-muted-foreground',
                        blockedStripes,
                    )}
                >
                    <CalendarOff className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                        {block.car!.name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                        {block.reason.label} · {blockPeriod(block)}
                        {block.note && ` · ${block.note}`}
                    </span>
                </span>
            </Link>
        </li>
    );
}

/**
 * A scrolling list that fades out at the bottom with a "More below" button
 * while there's more to see. Scrolls back to the top when `resetKey` changes.
 */
function ScrollWithHint({
    resetKey,
    children,
}: {
    resetKey: string;
    children: ReactNode;
}) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [hasMoreBelow, setHasMoreBelow] = useState(false);

    function measure(): void {
        const element = scrollRef.current;

        if (element) {
            setHasMoreBelow(
                element.scrollHeight -
                    element.scrollTop -
                    element.clientHeight >
                    8,
            );
        }
    }

    useEffect(() => {
        const element = scrollRef.current;

        if (!element) {
            return;
        }

        element.scrollTop = 0;
        measure();

        const observer = new ResizeObserver(measure);
        observer.observe(element);
        Array.from(element.children).forEach((child) =>
            observer.observe(child),
        );

        return () => observer.disconnect();
    }, [resetKey]);

    return (
        <div className="relative -mx-1 flex min-h-0 flex-1 flex-col">
            <div
                ref={scrollRef}
                onScroll={measure}
                className="min-h-0 flex-1 space-y-5 overflow-y-auto px-1 pb-1"
            >
                {children}
            </div>
            <div
                aria-hidden={!hasMoreBelow}
                className={cn(
                    'pointer-events-none absolute inset-x-0 bottom-0 flex h-20 items-end justify-center bg-gradient-to-t from-[color-mix(in_oklch,var(--muted)_20%,var(--background))] to-transparent pb-2 transition-opacity duration-200',
                    hasMoreBelow ? 'opacity-100' : 'opacity-0',
                )}
            >
                <button
                    type="button"
                    tabIndex={hasMoreBelow ? 0 : -1}
                    onClick={() =>
                        scrollRef.current?.scrollBy({
                            top: scrollRef.current.clientHeight * 0.7,
                            behavior: 'smooth',
                        })
                    }
                    className={cn(
                        'flex items-center gap-1 rounded-full border bg-background py-1 pr-2.5 pl-3 text-xs font-medium shadow-md transition-colors hover:border-foreground/30',
                        hasMoreBelow && 'pointer-events-auto',
                    )}
                >
                    More below
                    <ChevronDown className="size-3.5 animate-bounce" />
                </button>
            </div>
        </div>
    );
}

/** The 42 days (six weeks) shown for a month, Sunday first. */
function monthGrid(month: Date): string[] {
    const first = startOfWeek(startOfMonth(month));

    return Array.from({ length: 42 }, (_, index) =>
        toIsoDate(addDays(first, index)),
    );
}

/** Plain-language state for the day panel. */
const rowStates: Record<string, { label: string; dot: string }> = {
    pending: { label: 'Needs your answer', dot: 'bg-amber-500' },
    confirmed: { label: 'Confirmed', dot: 'bg-emerald-500' },
    completed: { label: 'Completed', dot: 'bg-muted-foreground/50' },
};

function BookingRow({ booking }: { booking: Booking }) {
    const canAct = ['pending', 'confirmed'].includes(booking.status.value);
    const state = rowStates[booking.status.value] ?? {
        label: booking.status.label,
        dot: 'bg-muted-foreground/50',
    };

    return (
        <li
            title={booking.reference}
            className={cn(
                'rounded-2xl border bg-background p-3',
                booking.status.value === 'pending' && 'border-amber-500/40',
            )}
        >
            <div className="flex items-center gap-3">
                <div className="size-11 shrink-0 overflow-hidden rounded-xl bg-muted">
                    {booking.car?.cover_image ? (
                        <img
                            src={booking.car.cover_image.url}
                            alt=""
                            className="size-full object-cover"
                        />
                    ) : (
                        <span className="flex size-full items-center justify-center">
                            <CarFront className="size-5 text-muted-foreground/40" />
                        </span>
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <Link
                        href={lessor.bookings.show(booking.reference)}
                        className="block truncate text-sm font-semibold hover:underline"
                    >
                        {booking.renter_name}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">
                        {booking.car?.name} · {booking.days}{' '}
                        {booking.days === 1 ? 'day' : 'days'}
                    </p>
                </div>
                <span className="shrink-0 text-sm font-bold tabular-nums">
                    {formatPeso(booking.total)}
                </span>
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-xs font-medium">
                    <span className={cn('size-2 rounded-full', state.dot)} />
                    {state.label}
                </span>
                <div className="flex items-center gap-1.5">
                    <Button
                        asChild
                        size="icon"
                        variant="ghost"
                        className="size-8 rounded-full"
                        tooltip={`Call ${booking.renter_phone}`}
                    >
                        <a
                            href={`tel:${booking.renter_phone}`}
                            aria-label={`Call ${booking.renter_name}, ${booking.renter_phone}`}
                        >
                            <Phone />
                        </a>
                    </Button>
                    {canAct && (
                        <BookingStatusActions booking={booking} compact />
                    )}
                </div>
            </div>

            <div className="mt-2 empty:hidden">
                <BookingPaymentReview booking={booking} />
            </div>
        </li>
    );
}

function DaySection({
    icon: Icon,
    title,
    info,
    bookings,
}: {
    icon: LucideIcon;
    title: string;
    info: string;
    bookings: Booking[];
}) {
    if (bookings.length === 0) {
        return null;
    }

    return (
        <section className="space-y-2">
            <h3 className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                <Icon className="size-3.5 text-brand" />
                {title}
                <span className="tabular-nums">· {bookings.length}</span>
                <InfoTip>{info}</InfoTip>
            </h3>
            <ul className="space-y-2">
                {bookings.map((booking) => (
                    <BookingRow key={booking.id} booking={booking} />
                ))}
            </ul>
        </section>
    );
}

/** Shade a day when every car is out or blocked, so full days stand out. */
function fullTint(isFull: boolean): string {
    return isFull
        ? 'bg-[color-mix(in_srgb,var(--brand)_12%,var(--background))]'
        : 'bg-background';
}

/** A small icon and number at the foot of a day, hidden when zero. */
function DayCount({
    icon: Icon,
    count,
    label,
    className,
    isSelected,
}: {
    icon: LucideIcon;
    count: number;
    label: string;
    className: string;
    isSelected: boolean;
}) {
    if (count <= 0) {
        return null;
    }

    return (
        <Hint text={`${count} ${label}`}>
            <span
                className={cn(
                    'flex items-center gap-0.5 rounded-full px-1 py-0.5',
                    isSelected
                        ? 'bg-white/10 text-ink-foreground/90'
                        : className,
                )}
            >
                <Icon className="size-3" />
                {count}
            </span>
        </Hint>
    );
}

/** One entry in the calendar's key: a swatch and what it means. */
function LegendItem({
    label,
    info,
    children,
}: {
    label: string;
    info?: string;
    children: ReactNode;
}) {
    return (
        <span className="flex items-center gap-2">
            <span aria-hidden className="flex w-5 justify-center">
                {children}
            </span>
            {label}
            {info && <InfoTip className="-ml-1">{info}</InfoTip>}
        </span>
    );
}

export default function LessorBookingsCalendar({
    bookings,
    blocks,
    blockOptions,
    fleetSize,
    selectedDate,
    today,
}: {
    /** Pending, confirmed and completed rentals overlapping the visible grid. */
    bookings: Booking[];
    /** Days the owner took cars off the calendar, overlapping the grid. */
    blocks: CarBlock[];
    blockOptions: BlockOptions;
    /** Live cars, to show how much of the fleet each day takes. */
    fleetSize: number;
    selectedDate: string;
    today: string;
}) {
    const [selected, setSelected] = useState(selectedDate);
    const [syncedDate, setSyncedDate] = useState(selectedDate);
    const [isBlocking, setIsBlocking] = useState(false);

    // Follow a server-side navigation (month change) to its selected day.
    if (syncedDate !== selectedDate) {
        setSyncedDate(selectedDate);
        setSelected(selectedDate);
    }

    const month = startOfMonth(parseISO(selectedDate));
    const grid = monthGrid(month);
    const day = activityOn(selected, bookings);
    const dayBlocks = blocksOn(selected, blocks);
    const isQuietDay =
        day.pickups.length +
            day.returns.length +
            day.outOnRent.length +
            dayBlocks.length ===
        0;

    /** Load another month; the grid only holds this month's bookings. */
    function visit(date: string): void {
        router.get(
            lessor.bookings.calendar().url,
            { date },
            { preserveScroll: true, preserveState: true, replace: true },
        );
    }

    /** Pick a day, loading its month first when it lies outside the grid. */
    function choose(date: string): void {
        if (grid.includes(date)) {
            setSelected(date);
        } else {
            visit(date);
        }
    }

    function shiftDay(days: number): void {
        choose(toIsoDate(addDays(parseISO(selected), days)));
    }

    /** Left and right arrow keys step through days, unless typing or in a dialog. */
    const onArrowKey = useEffectEvent((event: KeyboardEvent) => {
        const target = event.target as HTMLElement | null;
        const isTyping =
            target?.isContentEditable ||
            ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName ?? '');
        const step = { ArrowLeft: -1, ArrowRight: 1 }[event.key];

        if (
            !step ||
            isTyping ||
            isBlocking ||
            event.altKey ||
            event.ctrlKey ||
            event.metaKey ||
            document.querySelector(
                '[role="dialog"], [role="alertdialog"], [role="menu"]',
            )
        ) {
            return;
        }

        event.preventDefault();
        shiftDay(step);
    });

    // Keep keyboard focus on the selected day, so the focus ring never
    // lingers on a day that's no longer picked.
    const gridRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const grid = gridRef.current;

        if (grid?.contains(document.activeElement)) {
            grid.querySelector<HTMLElement>(
                `[data-date="${selected}"]`,
            )?.focus();
        }
    }, [selected, selectedDate]);

    useEffect(() => {
        window.addEventListener('keydown', onArrowKey);

        return () => window.removeEventListener('keydown', onArrowKey);
    }, []);

    return (
        <>
            <Head title="Booking calendar" />

            {/* On large screens the page fits one screen: the calendar's
                rows shrink to fit and the day panel scrolls inside. The
                height leaves room for the top bar and the inset margin. */}
            <div className="mx-auto w-full max-w-7xl space-y-8 p-4 md:p-8 lg:flex lg:h-[calc(100svh-5rem)] lg:flex-col lg:space-y-6">
                <PageHeader
                    title="Bookings"
                    description="Pick a day to see who's picking up, returning or out on the road."
                    actions={<BookingsViewTabs active="calendar" />}
                />

                <div className="grid gap-6 lg:min-h-0 lg:flex-1 lg:grid-cols-5">
                    <section className="rounded-3xl border bg-background p-4 sm:p-5 lg:col-span-3 lg:flex lg:min-h-0 lg:flex-col">
                        <div className="mb-4 flex shrink-0 items-center justify-between">
                            <Button
                                variant="ghost"
                                size="icon"
                                tooltip="Previous month"
                                onClick={() =>
                                    visit(toIsoDate(addMonths(month, -1)))
                                }
                            >
                                <ChevronLeft />
                            </Button>
                            <div className="text-center">
                                <h2 className="font-display text-xl font-bold tracking-tight">
                                    {format(month, 'MMMM yyyy')}
                                </h2>
                                {!isSameMonth(month, parseISO(today)) && (
                                    <button
                                        type="button"
                                        onClick={() => visit(today)}
                                        className="text-xs font-medium text-brand hover:underline"
                                    >
                                        Back to today
                                    </button>
                                )}
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                tooltip="Next month"
                                onClick={() =>
                                    visit(toIsoDate(addMonths(month, 1)))
                                }
                            >
                                <ChevronRight />
                            </Button>
                        </div>

                        <div className="grid shrink-0 grid-cols-7 pb-1 text-center text-xs font-medium text-muted-foreground">
                            {weekdayLabels.map((label) => (
                                <span key={label}>{label}</span>
                            ))}
                        </div>

                        <div
                            ref={gridRef}
                            className="grid grid-cols-7 gap-px overflow-hidden rounded-2xl border bg-border lg:min-h-0 lg:flex-1 lg:grid-rows-6"
                        >
                            {grid.map((date) => {
                                const activity = activityOn(date, bookings);
                                const blockedCount = blocksOn(
                                    date,
                                    blocks,
                                ).length;
                                const carsOut =
                                    activity.outOnRent.length +
                                    activity.pickups.length -
                                    activity.pendingCount;
                                const isSelected = date === selected;
                                const isToday = date === today;
                                const isPast = date < today;
                                const isFull =
                                    fleetSize > 0 &&
                                    carsOut + blockedCount >= fleetSize;
                                const inMonth = isSameMonth(
                                    parseISO(date),
                                    month,
                                );

                                return (
                                    <button
                                        key={date}
                                        data-date={date}
                                        type="button"
                                        aria-pressed={isSelected}
                                        aria-label={`${format(parseISO(date), 'EEEE, MMMM d')}: ${carsOut} out, ${activity.pickups.length} pickups, ${activity.returns.length} returns`}
                                        onClick={() => choose(date)}
                                        className={cn(
                                            'flex min-h-16 flex-col items-start gap-1 overflow-hidden p-1.5 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset sm:min-h-20 sm:p-2 lg:min-h-0',
                                            isSelected
                                                ? 'bg-ink text-ink-foreground'
                                                : cn(
                                                      'hover:bg-muted/60',
                                                      fullTint(isFull),
                                                  ),
                                            !inMonth &&
                                                !isSelected &&
                                                'bg-muted/30 text-muted-foreground/60',
                                        )}
                                    >
                                        <span className="flex w-full items-center justify-between gap-1">
                                            <span
                                                className={cn(
                                                    'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums',
                                                    isToday &&
                                                        !isSelected &&
                                                        'bg-brand text-brand-foreground',
                                                    isPast &&
                                                        !isToday &&
                                                        !isSelected &&
                                                        'text-muted-foreground',
                                                )}
                                            >
                                                {format(parseISO(date), 'd')}
                                            </span>
                                            {carsOut > 0 && (
                                                <Hint
                                                    text={
                                                        isFull
                                                            ? 'Every car is out or blocked. Renters can’t book this day.'
                                                            : `${carsOut} of your ${fleetSize} ${fleetSize === 1 ? 'car is' : 'cars are'} out`
                                                    }
                                                >
                                                    <span
                                                        className={cn(
                                                            'flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] leading-none font-semibold tabular-nums',
                                                            isSelected
                                                                ? 'bg-white/15'
                                                                : isFull
                                                                  ? 'bg-brand text-brand-foreground'
                                                                  : 'bg-background/80 text-brand ring-1 ring-brand/20',
                                                        )}
                                                    >
                                                        <CarFront className="size-3" />
                                                        {isFull
                                                            ? 'Full'
                                                            : fleetSize > 0
                                                              ? `${carsOut}/${fleetSize}`
                                                              : carsOut}
                                                    </span>
                                                </Hint>
                                            )}
                                        </span>
                                        <span className="mt-auto flex flex-wrap gap-1 text-[11px] leading-none font-semibold tabular-nums">
                                            <DayCount
                                                icon={ArrowUpFromLine}
                                                count={
                                                    activity.pickups.length -
                                                    activity.pendingCount
                                                }
                                                label="pickups"
                                                className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                                isSelected={isSelected}
                                            />
                                            <DayCount
                                                icon={ArrowDownToLine}
                                                count={activity.returns.length}
                                                label="returns"
                                                className="bg-sky-500/10 text-sky-700 dark:text-sky-400"
                                                isSelected={isSelected}
                                            />
                                            <DayCount
                                                icon={CircleDot}
                                                count={activity.pendingCount}
                                                label="requests waiting"
                                                className="bg-amber-500/15 text-amber-700 dark:text-amber-400"
                                                isSelected={isSelected}
                                            />
                                            <DayCount
                                                icon={CalendarOff}
                                                count={blockedCount}
                                                label="blocked"
                                                className="bg-muted text-muted-foreground"
                                                isSelected={isSelected}
                                            />
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-4 flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                            <LegendItem
                                label="Cars out"
                                info="How many of your live cars are rented that day, like 2/5."
                            >
                                <span className="flex items-center rounded-full px-1 py-0.5 text-brand ring-1 ring-brand/20">
                                    <CarFront className="size-3" />
                                </span>
                            </LegendItem>
                            <LegendItem
                                label="Full"
                                info="Every live car is rented or blocked, so renters can’t book that day."
                            >
                                <span className="flex items-center rounded-full bg-brand px-1 py-0.5 text-brand-foreground">
                                    <CarFront className="size-3" />
                                </span>
                            </LegendItem>
                            <LegendItem
                                label="Pickups"
                                info="Confirmed bookings where the renter collects the car that day."
                            >
                                <ArrowUpFromLine className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                            </LegendItem>
                            <LegendItem
                                label="Returns"
                                info="Confirmed bookings where the car comes back that day."
                            >
                                <ArrowDownToLine className="size-3.5 text-sky-600 dark:text-sky-400" />
                            </LegendItem>
                            <LegendItem
                                label="Needs your answer"
                                info="Requests waiting for you to confirm or decline, shown on their pickup day."
                            >
                                <CircleDot className="size-3.5 text-amber-600 dark:text-amber-400" />
                            </LegendItem>
                            <LegendItem
                                label="Blocked"
                                info="Cars you took off the calendar, for example for maintenance. Renters can’t book them on those days."
                            >
                                <CalendarOff className="size-3.5" />
                            </LegendItem>
                        </div>
                    </section>

                    {/* On large screens the day panel matches the calendar's
                        height and scrolls inside, so the page itself doesn't. */}
                    <div className="lg:relative lg:col-span-2">
                        <section className="flex flex-col rounded-3xl border bg-muted/20 p-4 sm:p-5 lg:absolute lg:inset-0">
                            <div className="mb-4 flex shrink-0 items-center justify-between gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    tooltip="Previous day"
                                    onClick={() => shiftDay(-1)}
                                >
                                    <ChevronLeft />
                                </Button>
                                <div className="text-center">
                                    <h2 className="font-display text-lg font-bold tracking-tight">
                                        {format(
                                            parseISO(selected),
                                            'EEEE, MMM d',
                                        )}
                                    </h2>
                                    {selected === today && (
                                        <p className="text-xs font-medium text-brand">
                                            Today
                                        </p>
                                    )}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    tooltip="Next day"
                                    onClick={() => shiftDay(1)}
                                >
                                    <ChevronRight />
                                </Button>
                            </div>

                            {isQuietDay ? (
                                <div className="flex flex-1 flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
                                    <CarFront className="size-8 opacity-40" />
                                    <p className="text-sm">
                                        No pickups, returns, rentals or blocked
                                        cars this day.
                                    </p>
                                </div>
                            ) : (
                                <ScrollWithHint resetKey={selected}>
                                    <DaySection
                                        icon={ArrowUpFromLine}
                                        title="Picking up"
                                        info="Renters collecting a car this day, including requests you haven't answered yet. Hand over the car and record the pickup check."
                                        bookings={day.pickups}
                                    />
                                    <DaySection
                                        icon={ArrowDownToLine}
                                        title="Returning"
                                        info="Cars coming back this day. Check the car, return the deposit, then mark the trip completed."
                                        bookings={day.returns}
                                    />
                                    <DaySection
                                        icon={Route}
                                        title="Out on rent"
                                        info="Cars already with a renter that aren't due back yet."
                                        bookings={day.outOnRent}
                                    />
                                    {dayBlocks.length > 0 && (
                                        <section className="space-y-2">
                                            <h3 className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                                                <CalendarOff className="size-3.5" />
                                                Blocked
                                                <span className="tabular-nums">
                                                    · {dayBlocks.length}
                                                </span>
                                                <InfoTip>
                                                    Cars you took off the
                                                    calendar. Renters can't book
                                                    them on these days.
                                                </InfoTip>
                                            </h3>
                                            <ul className="space-y-2">
                                                {dayBlocks.map((block) => (
                                                    <BlockRow
                                                        key={block.id}
                                                        block={block}
                                                    />
                                                ))}
                                            </ul>
                                        </section>
                                    )}
                                </ScrollWithHint>
                            )}

                            {selected >= today &&
                                blockOptions.cars.length > 0 && (
                                    <Button
                                        variant="outline"
                                        className="mt-4 w-full shrink-0 rounded-2xl border-dashed"
                                        onClick={() => setIsBlocking(true)}
                                    >
                                        <Plus /> Block a car from this day
                                    </Button>
                                )}
                        </section>
                    </div>
                </div>
            </div>

            <BlockDatesDialog
                open={isBlocking}
                onOpenChange={setIsBlocking}
                initialDate={selected}
                options={blockOptions}
            />
        </>
    );
}

LessorBookingsCalendar.layout = {
    breadcrumbs: [{ title: 'Bookings', href: lessor.bookings.calendar() }],
};
