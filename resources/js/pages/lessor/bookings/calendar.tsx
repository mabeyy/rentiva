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
    Phone,
    Plus,
    Route,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
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
    bookings,
}: {
    icon: LucideIcon;
    title: string;
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
            </h3>
            <ul className="space-y-2">
                {bookings.map((booking) => (
                    <BookingRow key={booking.id} booking={booking} />
                ))}
            </ul>
        </section>
    );
}

export default function LessorBookingsCalendar({
    bookings,
    blocks,
    blockOptions,
    selectedDate,
    today,
}: {
    /** Pending, confirmed and completed rentals overlapping the visible grid. */
    bookings: Booking[];
    /** Days the owner took cars off the calendar, overlapping the grid. */
    blocks: CarBlock[];
    blockOptions: BlockOptions;
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
            <div className="space-y-8 p-4 md:p-8 lg:flex lg:h-[calc(100svh-5rem)] lg:flex-col lg:space-y-6">
                <PageHeader
                    eyebrow="Requests and trips"
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
                                aria-label="Previous month"
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
                                aria-label="Next month"
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
                                                : 'bg-background hover:bg-muted/60',
                                            !inMonth &&
                                                !isSelected &&
                                                'bg-muted/30 text-muted-foreground/60',
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                'flex size-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums',
                                                isToday &&
                                                    !isSelected &&
                                                    'bg-brand text-brand-foreground',
                                            )}
                                        >
                                            {format(parseISO(date), 'd')}
                                        </span>
                                        {blockedCount > 0 && (
                                            <span
                                                className={cn(
                                                    'rounded-full border px-1.5 text-[10px] leading-4 font-semibold whitespace-nowrap tabular-nums',
                                                    isSelected
                                                        ? 'border-white/20 text-ink-foreground/80'
                                                        : cn(
                                                              'text-muted-foreground',
                                                              blockedStripes,
                                                          ),
                                                )}
                                            >
                                                {blockedCount} blocked
                                            </span>
                                        )}
                                        {carsOut > 0 && (
                                            <span
                                                className={cn(
                                                    'rounded-full px-1.5 text-[10px] leading-4 font-semibold whitespace-nowrap tabular-nums',
                                                    isSelected
                                                        ? 'bg-white/15'
                                                        : 'bg-brand/10 text-brand',
                                                )}
                                            >
                                                {carsOut} out
                                            </span>
                                        )}
                                        <span className="mt-auto flex gap-1">
                                            {activity.pickups.length > 0 && (
                                                <span className="size-1.5 rounded-full bg-emerald-500" />
                                            )}
                                            {activity.returns.length > 0 && (
                                                <span className="size-1.5 rounded-full bg-sky-500" />
                                            )}
                                            {activity.pendingCount > 0 && (
                                                <span className="size-1.5 rounded-full bg-amber-500" />
                                            )}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-4 flex shrink-0 flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                                <span className="rounded-full bg-brand/10 px-1.5 text-[10px] leading-4 font-semibold text-brand">
                                    2 out
                                </span>
                                Cars on rent
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span
                                    className={cn(
                                        'rounded-full border px-1.5 text-[10px] leading-4 font-semibold',
                                        blockedStripes,
                                    )}
                                >
                                    1 blocked
                                </span>
                                Not bookable
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="size-1.5 rounded-full bg-emerald-500" />
                                Pickup
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="size-1.5 rounded-full bg-sky-500" />
                                Return
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="size-1.5 rounded-full bg-amber-500" />
                                Needs your answer
                            </span>
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
                                    aria-label="Previous day"
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
                                    aria-label="Next day"
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
                                        bookings={day.pickups}
                                    />
                                    <DaySection
                                        icon={ArrowDownToLine}
                                        title="Returning"
                                        bookings={day.returns}
                                    />
                                    <DaySection
                                        icon={Route}
                                        title="Out on rent"
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
