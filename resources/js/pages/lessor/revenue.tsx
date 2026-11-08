import { Head, router } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import {
    Banknote,
    CalendarDays,
    CalendarX2,
    ChevronRight,
    Download,
    TrendingUp,
    Wallet,
} from 'lucide-react';
import { Fragment, useState } from 'react';
import { PageHeader } from '@/components/lessor/page-header';
import type { ReportRangePreset } from '@/components/lessor/report-range-picker';
import { ReportRangePicker } from '@/components/lessor/report-range-picker';
import { StatCard } from '@/components/stat-card';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatDateRange, formatPeso, toIsoDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import lessor from '@/routes/lessor';
import type { Booking } from '@/types';

type Granularity = 'day' | 'week' | 'month';

/** Amounts are in centavos. */
type Row = {
    key: string;
    label: string;
    bookings: number;
    days: number;
    revenue: number;
    averagePerBooking: number;
    children?: Row[];
};

type Report = {
    granularity: Granularity;
    today: string;
    from: string;
    to: string;
    rows: Row[];
    totals: {
        revenue: number;
        bookings: number;
        days: number;
        averagePerBooking: number;
        averagePerDay: number;
    };
};

type DayBookings = { date: string; bookings: Booking[] };

const granularities: { value: Granularity; label: string }[] = [
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
];

/** Quick ranges, relative to the server's "today". */
function presetsFor(today: string): ReportRangePreset[] {
    const end = parseISO(today);
    const daysAgo = (days: number): string =>
        toIsoDate(
            new Date(end.getFullYear(), end.getMonth(), end.getDate() - days),
        );

    return [
        { label: 'Last 7 days', from: daysAgo(6), to: today },
        { label: 'Last 30 days', from: daysAgo(29), to: today },
        { label: 'Last 90 days', from: daysAgo(89), to: today },
        {
            label: 'This month',
            from: toIsoDate(new Date(end.getFullYear(), end.getMonth(), 1)),
            to: today,
        },
        {
            label: 'Last month',
            from: toIsoDate(new Date(end.getFullYear(), end.getMonth() - 1, 1)),
            to: toIsoDate(new Date(end.getFullYear(), end.getMonth(), 0)),
        },
        {
            label: 'This year',
            from: toIsoDate(new Date(end.getFullYear(), 0, 1)),
            to: today,
        },
    ];
}

/** True for a single-day key (YYYY-MM-DD), as opposed to a week or month. */
function isDayKey(key: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(key);
}

function FilterLabel({ children }: { children: string }) {
    return (
        <span className="text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
            {children}
        </span>
    );
}

export default function LessorRevenue({
    report,
    dayBookings,
}: {
    report: Report;
    /** Only resolved by a partial reload when a day row is opened. */
    dayBookings?: DayBookings | null;
}) {
    const { granularity, rows, totals } = report;
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [hideEmpty, setHideEmpty] = useState(true);
    const [openDay, setOpenDay] = useState<string | null>(null);
    const [isLoadingDay, setIsLoadingDay] = useState(false);

    const isDayReady = openDay !== null && dayBookings?.date === openDay;
    const hasDayFailed = openDay !== null && !isLoadingDay && !isDayReady;

    function reloadReport(changes: Partial<Record<string, string>>): void {
        router.reload({
            only: ['report'],
            data: {
                granularity,
                from: report.from,
                to: report.to,
                ...changes,
            },
        });
    }

    function showDay(date: string): void {
        setOpenDay(date);
        setIsLoadingDay(true);
        router.reload({
            only: ['dayBookings'],
            data: { day: date },
            onFinish: () => setIsLoadingDay(false),
        });
    }

    function toggleRow(key: string): void {
        setExpanded((previous) => {
            const next = new Set(previous);

            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }

            return next;
        });
    }

    const newestFirst = [...rows].reverse();
    const visibleRows = hideEmpty
        ? newestFirst.filter((row) => row.bookings > 0)
        : newestFirst;
    const hiddenCount = newestFirst.length - visibleRows.length;
    const exportUrl = (key?: string): string =>
        lessor.revenue.export({
            query: {
                granularity,
                from: report.from,
                to: report.to,
                ...(key && { key }),
            },
        }).url;

    return (
        <>
            <Head title="Revenue" />

            <div className="space-y-8 p-4 md:p-8">
                <PageHeader
                    eyebrow="Your earnings"
                    title="Revenue"
                    description="What your bookings brought in, by pickup date. Counts confirmed and completed trips."
                    actions={
                        <Button
                            variant="outline"
                            className="h-11 rounded-full bg-background px-5"
                            asChild
                        >
                            <a href={exportUrl()}>
                                <Download /> Export CSV
                            </a>
                        </Button>
                    }
                />

                <div className="grid gap-4 sm:grid-cols-3">
                    <StatCard
                        label="Total revenue"
                        value={formatPeso(totals.revenue)}
                        icon={TrendingUp}
                        hint={`${formatDateRange(report.from, report.to)}`}
                        highlighted={totals.revenue > 0}
                    />
                    <StatCard
                        label="Average per booking"
                        value={formatPeso(totals.averagePerBooking)}
                        icon={Wallet}
                        hint={`${totals.bookings} ${totals.bookings === 1 ? 'booking' : 'bookings'}`}
                    />
                    <StatCard
                        label="Average per rental day"
                        value={formatPeso(totals.averagePerDay)}
                        icon={CalendarDays}
                        hint={`${totals.days} rental ${totals.days === 1 ? 'day' : 'days'}`}
                    />
                </div>

                <section className="space-y-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <h2 className="font-display text-xl font-bold tracking-tight">
                                Revenue by {granularity}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {totals.bookings}{' '}
                                {totals.bookings === 1 ? 'booking' : 'bookings'}
                                {hideEmpty &&
                                    hiddenCount > 0 &&
                                    ` · ${hiddenCount} empty hidden`}
                                {granularity !== 'day' &&
                                    ' · Click a row to see its days'}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
                            <div className="flex flex-col gap-1.5">
                                <FilterLabel>Period</FilterLabel>
                                <ReportRangePicker
                                    from={report.from}
                                    to={report.to}
                                    presets={presetsFor(report.today)}
                                    onChange={(range) => reloadReport(range)}
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <FilterLabel>Group by</FilterLabel>
                                <div
                                    role="radiogroup"
                                    aria-label="Group by"
                                    className="flex h-11 items-center gap-1 rounded-full border bg-background p-1"
                                >
                                    {granularities.map(({ value, label }) => (
                                        <button
                                            key={value}
                                            type="button"
                                            role="radio"
                                            aria-checked={granularity === value}
                                            onClick={() =>
                                                reloadReport({
                                                    granularity: value,
                                                })
                                            }
                                            className={cn(
                                                'h-full rounded-full px-4 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                                                granularity === value
                                                    ? 'bg-ink text-ink-foreground'
                                                    : 'text-muted-foreground hover:text-foreground',
                                            )}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <label className="flex h-11 cursor-pointer items-center gap-2 rounded-full border bg-background px-4 text-sm">
                                <input
                                    type="checkbox"
                                    checked={hideEmpty}
                                    onChange={(event) =>
                                        setHideEmpty(event.target.checked)
                                    }
                                    className="size-4 accent-[var(--brand)]"
                                />
                                Hide empty
                            </label>
                        </div>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{granularity}</TableHead>
                                <TableHead className="text-right">
                                    Bookings
                                </TableHead>
                                <TableHead className="text-right">
                                    Rental days
                                </TableHead>
                                <TableHead className="text-right">
                                    Revenue
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {visibleRows.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={4}
                                        className="py-12 text-center text-muted-foreground"
                                    >
                                        No paid bookings in this period.
                                    </TableCell>
                                </TableRow>
                            )}
                            {visibleRows.map((row) => {
                                const hasChildren = Boolean(
                                    row.children?.length,
                                );
                                const isOpen = expanded.has(row.key);
                                const isEmpty = row.bookings === 0;
                                const drillsToDay =
                                    !hasChildren &&
                                    !isEmpty &&
                                    isDayKey(row.key);

                                return (
                                    <Fragment key={row.key}>
                                        <TableRow
                                            className={cn(
                                                'group border-b last:border-0 hover:bg-muted/40',
                                                (hasChildren || drillsToDay) &&
                                                    'cursor-pointer',
                                            )}
                                            title={
                                                drillsToDay
                                                    ? "View this day's bookings"
                                                    : undefined
                                            }
                                            onClick={
                                                hasChildren
                                                    ? () => toggleRow(row.key)
                                                    : drillsToDay
                                                      ? () => showDay(row.key)
                                                      : undefined
                                            }
                                        >
                                            <TableCell
                                                className={cn(
                                                    'font-medium whitespace-nowrap',
                                                    isEmpty &&
                                                        'text-muted-foreground',
                                                )}
                                            >
                                                <span className="flex items-center gap-1.5">
                                                    {hasChildren ? (
                                                        <ChevronRight
                                                            className={cn(
                                                                'size-4 shrink-0 text-muted-foreground transition-transform',
                                                                isOpen &&
                                                                    'rotate-90',
                                                            )}
                                                        />
                                                    ) : (
                                                        <span className="w-4 shrink-0" />
                                                    )}
                                                    {row.label}
                                                    {hasChildren && (
                                                        <a
                                                            href={exportUrl(
                                                                row.key,
                                                            )}
                                                            onClick={(event) =>
                                                                event.stopPropagation()
                                                            }
                                                            title={`Export ${row.label} by day`}
                                                            aria-label={`Export ${row.label} by day`}
                                                            className="ml-1 rounded p-1 text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:bg-muted hover:text-foreground focus-visible:opacity-100"
                                                        >
                                                            <Download className="size-3.5" />
                                                        </a>
                                                    )}
                                                </span>
                                            </TableCell>
                                            <TableCell
                                                className={cn(
                                                    'text-right tabular-nums',
                                                    isEmpty &&
                                                        'text-muted-foreground',
                                                )}
                                            >
                                                {row.bookings}
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground tabular-nums">
                                                {row.days}
                                            </TableCell>
                                            <TableCell
                                                className={cn(
                                                    'text-right tabular-nums',
                                                    isEmpty
                                                        ? 'text-muted-foreground'
                                                        : 'font-semibold',
                                                )}
                                            >
                                                {formatPeso(row.revenue)}
                                            </TableCell>
                                        </TableRow>
                                        {isOpen &&
                                            row.children?.map((child) => (
                                                <TableRow
                                                    key={child.key}
                                                    className="cursor-pointer border-b bg-muted/20 text-muted-foreground last:border-0 hover:bg-muted/50"
                                                    title="View this day's bookings"
                                                    onClick={() =>
                                                        showDay(child.key)
                                                    }
                                                >
                                                    <TableCell className="whitespace-nowrap first:pl-12">
                                                        {child.label}
                                                    </TableCell>
                                                    <TableCell className="text-right tabular-nums">
                                                        {child.bookings}
                                                    </TableCell>
                                                    <TableCell className="text-right tabular-nums">
                                                        {child.days}
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium text-foreground tabular-nums">
                                                        {formatPeso(
                                                            child.revenue,
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                    </Fragment>
                                );
                            })}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TableCell>Total</TableCell>
                                <TableCell className="text-right tabular-nums">
                                    {totals.bookings}
                                </TableCell>
                                <TableCell className="text-right tabular-nums">
                                    {totals.days}
                                </TableCell>
                                <TableCell className="text-right tabular-nums">
                                    {formatPeso(totals.revenue)}
                                </TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </section>

                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Banknote className="size-3.5" />
                    Renters pay you at pickup. Pending, declined and cancelled
                    bookings are not counted.
                </p>
            </div>

            <Dialog
                open={openDay !== null}
                onOpenChange={(isOpen) => !isOpen && setOpenDay(null)}
            >
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {openDay
                                ? format(parseISO(openDay), 'EEEE, MMM d, yyyy')
                                : 'Bookings'}
                        </DialogTitle>
                        <DialogDescription>
                            {isDayReady
                                ? `${dayBookings.bookings.length} ${dayBookings.bookings.length === 1 ? 'pickup' : 'pickups'} this day`
                                : hasDayFailed
                                  ? 'Could not load'
                                  : 'Loading…'}
                        </DialogDescription>
                    </DialogHeader>

                    {hasDayFailed ? (
                        <div className="flex h-32 flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                            <p className="text-sm">
                                Couldn't load this day's bookings.
                            </p>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDay && showDay(openDay)}
                            >
                                Try again
                            </Button>
                        </div>
                    ) : !isDayReady ? (
                        <div className="flex h-32 items-center justify-center text-muted-foreground">
                            <Spinner />
                        </div>
                    ) : dayBookings.bookings.length === 0 ? (
                        <div className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground">
                            <CalendarX2 className="size-7 opacity-60" />
                            <p className="text-sm">No pickups on this day.</p>
                        </div>
                    ) : (
                        <ul className="max-h-[60vh] divide-y overflow-y-auto rounded-2xl border">
                            {dayBookings.bookings.map((booking) => (
                                <li
                                    key={booking.id}
                                    className="flex items-center justify-between gap-3 p-3"
                                >
                                    <div className="min-w-0">
                                        <p className="flex items-center gap-2 font-medium">
                                            <span className="truncate">
                                                {booking.renter_name}
                                            </span>
                                            <StatusBadge
                                                status={booking.status}
                                            />
                                        </p>
                                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                            {booking.car?.name} ·{' '}
                                            {formatDateRange(
                                                booking.start_date,
                                                booking.end_date,
                                            )}{' '}
                                            · {booking.reference}
                                        </p>
                                    </div>
                                    <span className="shrink-0 font-semibold tabular-nums">
                                        {formatPeso(booking.total)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

LessorRevenue.layout = {
    breadcrumbs: [{ title: 'Revenue', href: lessor.revenue.index() }],
};
