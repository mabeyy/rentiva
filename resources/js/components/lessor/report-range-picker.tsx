import { format, parseISO } from 'date-fns';
import { CalendarDays, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { toIsoDate } from '@/lib/format';
import { cn } from '@/lib/utils';

export type ReportRange = { from: string; to: string };
export type ReportRangePreset = ReportRange & { label: string };

/** e.g. "Nov 1, 2026". */
function short(date: string): string {
    return format(parseISO(date), 'MMM d, yyyy');
}

/**
 * Picks a past date range for a report. The trigger names the active preset
 * with the exact dates underneath; the popover pairs shortcuts with a
 * two-month range calendar (click a start date, then an end date).
 */
export function ReportRangePicker({
    from,
    to,
    onChange,
    presets = [],
}: ReportRange & {
    onChange: (range: ReportRange) => void;
    presets?: ReportRangePreset[];
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [draft, setDraft] = useState<DateRange | undefined>();
    const activePreset = presets.find(
        (preset) => preset.from === from && preset.to === to,
    );
    const isPickingEnd = Boolean(draft?.from) && !draft?.to;

    function toggle(nextIsOpen: boolean): void {
        setDraft(undefined);
        setIsOpen(nextIsOpen);
    }

    /** First click starts a fresh range; the second completes it. */
    function select(_range: DateRange | undefined, clickedDay: Date): void {
        if (!draft?.from) {
            setDraft({ from: clickedDay, to: undefined });

            return;
        }

        const [start, end] =
            clickedDay < draft.from
                ? [clickedDay, draft.from]
                : [draft.from, clickedDay];

        onChange({ from: toIsoDate(start), to: toIsoDate(end) });
        toggle(false);
    }

    function pick(preset: ReportRangePreset): void {
        onChange({ from: preset.from, to: preset.to });
        toggle(false);
    }

    return (
        <Popover open={isOpen} onOpenChange={toggle}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className="group flex h-11 items-center gap-2.5 rounded-full border bg-background pr-3 pl-1.5 text-left transition-colors hover:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                        <CalendarDays className="size-4" />
                    </span>
                    <span className="flex flex-col leading-tight">
                        <span className="text-sm font-semibold">
                            {activePreset ? activePreset.label : 'Custom'}
                        </span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                            {short(from)} – {short(to)}
                        </span>
                    </span>
                    <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-0">
                <div className="flex flex-col sm:flex-row">
                    {presets.length > 0 && (
                        <div className="flex gap-1 overflow-x-auto border-b p-2 sm:w-36 sm:flex-col sm:gap-0.5 sm:border-r sm:border-b-0">
                            {presets.map((preset) => (
                                <button
                                    key={preset.label}
                                    type="button"
                                    onClick={() => pick(preset)}
                                    className={cn(
                                        'shrink-0 rounded-md px-3 py-1.5 text-left text-sm whitespace-nowrap transition-colors sm:w-full',
                                        preset === activePreset
                                            ? 'bg-brand/10 font-medium text-brand'
                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                    )}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                    )}
                    <div>
                        <Calendar
                            mode="range"
                            numberOfMonths={2}
                            selected={
                                draft ?? {
                                    from: parseISO(from),
                                    to: parseISO(to),
                                }
                            }
                            onSelect={select}
                            defaultMonth={parseISO(from)}
                            disabled={{ after: new Date() }}
                        />
                        <p className="px-3 pb-3 text-center text-xs text-muted-foreground">
                            {isPickingEnd
                                ? 'Now pick the end date.'
                                : 'Pick the start date.'}
                        </p>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
