import { addDays, format, parseISO, startOfToday } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import type { DateRange, Matcher } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { formatDate, formatDateRange, toIsoDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { BookedRange } from '@/types';

/**
 * Convert booked ranges to calendar matchers. The return day stays selectable
 * as a pickup day, so each range blocks start → (end − 1).
 */
function bookedMatchers(bookedRanges: BookedRange[]): Matcher[] {
    return bookedRanges.map((range) => ({
        from: parseISO(range.start_date),
        to: addDays(parseISO(range.end_date), -1),
    }));
}

/**
 * Days that can't be the return day once `pickup` is chosen: anything past
 * the next booking's start. That start day itself stays open, since the car
 * can come back the morning another renter picks it up (matching the server's
 * overlap check). Earlier booked days stay blocked so a re-picked pickup day
 * is still free.
 */
function returnDayMatchers(
    pickup: Date,
    bookedRanges: BookedRange[],
): Matcher[] {
    const nextBookingStart = bookedRanges
        .map((range) => parseISO(range.start_date))
        .filter((start) => start > pickup)
        .sort((first, second) => first.getTime() - second.getTime())[0];

    return [
        ...bookedMatchers(
            bookedRanges.filter((range) => parseISO(range.start_date) < pickup),
        ),
        ...(nextBookingStart ? [{ after: nextBookingStart }] : []),
    ];
}

/**
 * Parse an ISO start/end pair into a react-day-picker range.
 */
export function toDateRange(
    startDate?: string | null,
    endDate?: string | null,
): DateRange | undefined {
    return startDate
        ? {
              from: parseISO(startDate),
              to: endDate ? parseISO(endDate) : undefined,
          }
        : undefined;
}

function isCompleteRange(
    range: DateRange | undefined,
): range is { from: Date; to: Date } {
    return Boolean(range?.from && range.to && range.from < range.to);
}

function label(range: DateRange | undefined): string {
    if (range?.from && range.to) {
        return formatDateRange(toIsoDate(range.from), toIsoDate(range.to));
    }

    return range?.from
        ? `${formatDate(toIsoDate(range.from))} – …`
        : 'Pickup – return';
}

/** One labelled half of the split Pickup / Return trigger. */
function SplitField({ label, date }: { label: string; date?: Date }) {
    return (
        <span className="min-w-0 px-4 py-2.5 text-left">
            <span className="block text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                {label}
            </span>
            <span
                className={cn(
                    'mt-0.5 flex items-center gap-1.5 truncate text-sm font-medium',
                    !date && 'text-muted-foreground',
                )}
            >
                <CalendarIcon className="size-3.5 shrink-0" />
                {date ? format(date, 'EEE, MMM d') : 'Add date'}
            </span>
        </span>
    );
}

/**
 * Pickup/return range picker. `variant="split"` shows two labelled fields;
 * pass `open`/`onOpenChange` to open it from elsewhere (e.g. a CTA button).
 */
export function DateRangePicker({
    value,
    onChange,
    bookedRanges = [],
    id,
    className,
    variant = 'default',
    open,
    onOpenChange,
    rules,
}: {
    /** The owner's booking rules: first and last bookable day, shortest rental. */
    rules?: { earliest?: Date; latest?: Date; minDays?: number };
    value: DateRange | undefined;
    onChange: (range: DateRange | undefined) => void;
    bookedRanges?: BookedRange[];
    id?: string;
    className?: string;
    variant?: 'default' | 'split';
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}) {
    const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(false);
    const isOpen = open ?? uncontrolledIsOpen;

    function setIsOpen(nextIsOpen: boolean): void {
        setUncontrolledIsOpen(nextIsOpen);
        onOpenChange?.(nextIsOpen);
    }
    const [draft, setDraft] = useState<DateRange | undefined>(value);

    /**
     * The first click only picks the pickup day, so keep it as a draft here
     * and report the range once a later return day completes it. Clicking
     * while a full range is shown starts a new pickup day.
     */
    function select(range: DateRange | undefined, clickedDay: Date): void {
        const next = isCompleteRange(draft)
            ? { from: clickedDay, to: undefined }
            : range;

        setDraft(next);

        if (isCompleteRange(next)) {
            onChange(next);
            setIsOpen(false);
        }
    }

    const isPickingReturn = Boolean(draft?.from) && !isCompleteRange(draft);

    function toggle(nextIsOpen: boolean): void {
        setDraft(value);
        setIsOpen(nextIsOpen);
    }

    return (
        <Popover open={isOpen} onOpenChange={toggle}>
            <PopoverTrigger asChild>
                {variant === 'split' ? (
                    <button
                        id={id}
                        type="button"
                        className={cn(
                            'grid w-full grid-cols-2 divide-x rounded-2xl border bg-background transition-colors outline-none hover:border-foreground/30 focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[state=open]:border-brand',
                            className,
                        )}
                    >
                        <SplitField label="Pickup" date={value?.from} />
                        <SplitField label="Return" date={value?.to} />
                    </button>
                ) : (
                    <Button
                        id={id}
                        type="button"
                        variant="outline"
                        className={cn(
                            'w-full justify-start font-normal',
                            !value?.from && 'text-muted-foreground',
                            className,
                        )}
                    >
                        <CalendarIcon />
                        {label(value)}
                    </Button>
                )}
            </PopoverTrigger>
            <PopoverContent
                className="w-auto p-0"
                align={variant === 'split' ? 'end' : 'start'}
            >
                <Calendar
                    mode="range"
                    numberOfMonths={2}
                    selected={draft}
                    onSelect={select}
                    defaultMonth={draft?.from}
                    excludeDisabled
                    disabled={[
                        { before: rules?.earliest ?? startOfToday() },
                        ...(isPickingReturn && draft?.from
                            ? [
                                  ...returnDayMatchers(
                                      draft.from,
                                      bookedRanges,
                                  ),
                                  ...((rules?.minDays ?? 1) > 1
                                      ? [
                                            {
                                                after: draft.from,
                                                before: addDays(
                                                    draft.from,
                                                    rules?.minDays ?? 1,
                                                ),
                                            },
                                        ]
                                      : []),
                              ]
                            : [
                                  ...bookedMatchers(bookedRanges),
                                  ...(rules?.latest
                                      ? [{ after: rules.latest }]
                                      : []),
                              ]),
                    ]}
                    footer={
                        <p className="px-3 pb-3 text-center text-xs text-muted-foreground">
                            {isPickingReturn
                                ? 'Now pick your return date.'
                                : 'Pick your pickup date.'}
                            {(rules?.minDays ?? 1) > 1 &&
                                ` At least ${rules?.minDays} days.`}
                            {bookedRanges.length > 0 &&
                                ' Greyed-out days are unavailable.'}
                        </p>
                    }
                />
            </PopoverContent>
        </Popover>
    );
}
