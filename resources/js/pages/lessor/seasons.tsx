import { Head, router, useForm } from '@inertiajs/react';
import {
    addDays,
    differenceInCalendarDays,
    format,
    max,
    parseISO,
    startOfDay,
} from 'date-fns';
import { Pencil, Plus, Sun, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import { FormField } from '@/components/form-field';
import InputError from '@/components/input-error';
import { PageHeader } from '@/components/lessor/page-header';
import { UpgradeNote } from '@/components/lessor/upgrade-note';
import { BrandButton } from '@/components/public/brand-button';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { toIsoDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import lessor from '@/routes/lessor';

type Season = {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    rate_change: number;
};

type Suggestion = {
    name: string;
    /** A shorter name for the suggestion pill. */
    label: string;
    rate_change: number;
    /** The season's days in a given year; it may end in the next year. */
    datesIn: (year: number) => { from: Date; to: Date };
};

/** Easter Sunday in the given year (anonymous Gregorian algorithm). */
function easterSunday(year: number): Date {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;

    return new Date(year, month - 1, day);
}

/** The busy and quiet stretches most Philippine rental owners price for. */
const suggestions: Suggestion[] = [
    {
        name: 'Christmas & New Year',
        label: 'Christmas',
        rate_change: 30,
        datesIn: (year) => ({
            from: new Date(year, 11, 20),
            to: new Date(year + 1, 0, 3),
        }),
    },
    {
        name: 'Holy Week',
        label: 'Holy Week',
        rate_change: 25,
        datesIn: (year) => {
            const easter = easterSunday(year);

            return { from: addDays(easter, -7), to: easter };
        },
    },
    {
        name: 'Summer',
        label: 'Summer',
        rate_change: 15,
        datesIn: (year) => ({
            from: new Date(year, 3, 1),
            to: new Date(year, 4, 31),
        }),
    },
    {
        name: 'Rainy season',
        label: 'Rainy',
        rate_change: -10,
        datesIn: (year) => ({
            from: new Date(year, 6, 1),
            to: new Date(year, 8, 30),
        }),
    },
];

/**
 * The next time a suggested season comes around: this year's if it hasn't
 * ended, starting today when it's already under way, otherwise next year's.
 */
function nextDates(suggestion: Suggestion): { from: Date; to: Date } {
    const today = startOfDay(new Date());
    // Last year's may still be running, e.g. Christmas & New Year in early January.
    const year = [-1, 0, 1]
        .map((offset) => today.getFullYear() + offset)
        .find((candidate) => suggestion.datesIn(candidate).to >= today)!;
    const dates = suggestion.datesIn(year);

    return { from: max([dates.from, today]), to: dates.to };
}

/** A signed percent, e.g. "+30%" or "−10%". */
function signedPercent(percent: number): string {
    return `${percent > 0 ? '+' : '−'}${Math.abs(percent)}%`;
}

/** e.g. "Dec 20, 2026 – Jan 3, 2027". */
function period(season: Pick<Season, 'start_date' | 'end_date'>): string {
    return `${format(parseISO(season.start_date), 'MMM d, yyyy')} – ${format(parseISO(season.end_date), 'MMM d, yyyy')}`;
}

function SeasonForm({
    season,
    onDone,
}: {
    season: Season | null;
    onDone: () => void;
}) {
    const [range, setRange] = useState<DateRange | undefined>(
        season
            ? {
                  from: parseISO(season.start_date),
                  to: parseISO(season.end_date),
              }
            : undefined,
    );
    const [month, setMonth] = useState<Date>(range?.from ?? new Date());
    const form = useForm({
        name: season?.name ?? '',
        start_date: season?.start_date ?? '',
        end_date: season?.end_date ?? '',
        rate_change: season ? String(season.rate_change) : '20',
    });

    function chooseRange(next: DateRange | undefined): void {
        setRange(next);
        form.setData((data) => ({
            ...data,
            start_date: next?.from ? toIsoDate(next.from) : '',
            end_date: next?.to
                ? toIsoDate(next.to)
                : next?.from
                  ? toIsoDate(next.from)
                  : '',
        }));
    }

    function applySuggestion(suggestion: Suggestion): void {
        const dates = nextDates(suggestion);

        setRange(dates);
        setMonth(dates.from);
        form.setData({
            name: suggestion.name,
            rate_change: String(suggestion.rate_change),
            start_date: toIsoDate(dates.from),
            end_date: toIsoDate(dates.to),
        });
    }

    function submit(event: FormEvent): void {
        event.preventDefault();
        const options = { preserveScroll: true, onSuccess: onDone };

        if (season) {
            form.put(lessor.seasons.update(season.id).url, options);
        } else {
            form.post(lessor.seasons.store().url, options);
        }
    }

    return (
        <form onSubmit={submit} className="space-y-4">
            <DialogHeader>
                <DialogTitle>
                    {season ? 'Edit season' : 'Add a season'}
                </DialogTitle>
                <DialogDescription>
                    Every car's daily rate changes by this much on these days.
                    Bookings already made keep their price.
                </DialogDescription>
            </DialogHeader>

            {!season && (
                <div className="flex flex-wrap gap-1.5">
                    {suggestions.map((suggestion) => {
                        const dates = nextDates(suggestion);
                        const isChosen =
                            form.data.name === suggestion.name &&
                            form.data.start_date === toIsoDate(dates.from);

                        return (
                            <button
                                key={suggestion.name}
                                type="button"
                                aria-pressed={isChosen}
                                title={`${suggestion.name}, ${format(dates.from, 'MMM d')} – ${format(dates.to, 'MMM d, yyyy')}`}
                                onClick={() => applySuggestion(suggestion)}
                                className={cn(
                                    'flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs whitespace-nowrap transition-colors hover:border-foreground/30',
                                    isChosen &&
                                        'border-brand bg-brand/5 hover:border-brand',
                                )}
                            >
                                {suggestion.label}
                                <span
                                    className={cn(
                                        'font-semibold tabular-nums',
                                        suggestion.rate_change > 0
                                            ? 'text-brand'
                                            : 'text-sky-700 dark:text-sky-300',
                                    )}
                                >
                                    {signedPercent(suggestion.rate_change)}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}

            <div className="grid grid-cols-[1fr_8rem] gap-3">
                <FormField
                    id="season_name"
                    label="Name"
                    error={form.errors.name}
                >
                    <Input
                        id="season_name"
                        value={form.data.name}
                        onChange={(event) =>
                            form.setData('name', event.target.value)
                        }
                        placeholder="e.g. Christmas"
                        maxLength={60}
                        required
                    />
                </FormField>
                <FormField
                    id="rate_change"
                    label="Rate change"
                    error={form.errors.rate_change}
                >
                    <div className="relative">
                        <Input
                            id="rate_change"
                            type="number"
                            min={-50}
                            max={200}
                            value={form.data.rate_change}
                            onChange={(event) =>
                                form.setData('rate_change', event.target.value)
                            }
                            className="pr-8 tabular-nums"
                            required
                        />
                        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">
                            %
                        </span>
                    </div>
                </FormField>
            </div>
            <p className="-mt-2 text-xs text-muted-foreground">
                Use a minus for a low season, e.g. −10.
            </p>

            <div className="overflow-hidden rounded-2xl border">
                <Calendar
                    mode="range"
                    selected={range}
                    onSelect={chooseRange}
                    month={month}
                    onMonthChange={setMonth}
                    // Fill the box: cells widen to share the row, rows keep a normal height.
                    className="w-full [&_td]:aspect-auto [&_td]:h-10 [&_td_button]:aspect-auto [&_td_button]:h-10"
                    classNames={{ root: 'w-full' }}
                />
            </div>
            <InputError
                message={form.errors.start_date ?? form.errors.end_date}
            />

            <DialogFooter>
                <Button type="button" variant="ghost" onClick={onDone}>
                    Cancel
                </Button>
                <BrandButton
                    type="submit"
                    disabled={form.processing || !form.data.start_date}
                >
                    {form.processing && <Spinner />}
                    {season ? 'Save' : 'Add season'}
                </BrandButton>
            </DialogFooter>
        </form>
    );
}

export default function LessorSeasons({
    seasons,
    pastCount,
    isIncluded,
}: {
    seasons: Season[];
    pastCount: number;
    /** Whether the owner's plan includes season pricing. */
    isIncluded: boolean;
}) {
    const [editing, setEditing] = useState<Season | 'new' | null>(null);

    return (
        <>
            <Head title="Peak seasons" />

            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8">
                <PageHeader
                    title="Peak seasons"
                    description="Charge more when demand is high, like Christmas or Holy Week, or less in quiet months. Applies to all your cars."
                    actions={
                        isIncluded ? (
                            <BrandButton
                                className="h-11 rounded-full px-5"
                                onClick={() => setEditing('new')}
                            >
                                <Plus /> Add season
                            </BrandButton>
                        ) : (
                            <UpgradeNote className="h-9 px-4 text-sm">
                                Season pricing is on Growth and Fleet
                            </UpgradeNote>
                        )
                    }
                />

                {seasons.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Season</TableHead>
                                <TableHead>Dates</TableHead>
                                <TableHead className="text-right">
                                    Days
                                </TableHead>
                                <TableHead className="text-right">
                                    Rate change
                                </TableHead>
                                <TableHead>
                                    <span className="sr-only">Actions</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {seasons.map((season) => {
                                const isUp = season.rate_change > 0;
                                const days =
                                    differenceInCalendarDays(
                                        parseISO(season.end_date),
                                        parseISO(season.start_date),
                                    ) + 1;

                                return (
                                    <TableRow key={season.id}>
                                        <TableCell className="font-medium">
                                            {season.name}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap text-muted-foreground">
                                            {period(season)}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">
                                            {days}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span
                                                className={cn(
                                                    'inline-flex min-w-14 items-center justify-center rounded-full px-2.5 py-0.5 text-sm font-bold tabular-nums',
                                                    isUp
                                                        ? 'bg-brand/10 text-brand'
                                                        : 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
                                                )}
                                            >
                                                {signedPercent(
                                                    season.rate_change,
                                                )}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right whitespace-nowrap">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                tooltip="Edit"
                                                aria-label={`Edit ${season.name}`}
                                                onClick={() =>
                                                    setEditing(season)
                                                }
                                            >
                                                <Pencil />
                                            </Button>
                                            <ConfirmDialog
                                                trigger={
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        tooltip="Remove"
                                                        aria-label={`Remove ${season.name}`}
                                                    >
                                                        <Trash2 />
                                                    </Button>
                                                }
                                                title={`Remove ${season.name}?`}
                                                description="Normal rates apply on those days again. Bookings already made keep their price."
                                                confirmLabel="Remove"
                                                onConfirm={() =>
                                                    router.delete(
                                                        lessor.seasons.destroy(
                                                            season.id,
                                                        ).url,
                                                        {
                                                            preserveScroll: true,
                                                        },
                                                    )
                                                }
                                            />
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                ) : (
                    <EmptyState
                        icon={Sun}
                        title="No seasons yet"
                        description="Add your busy dates once and every car's price follows automatically."
                    />
                )}
                {pastCount > 0 && (
                    <p className="text-sm text-muted-foreground">
                        {pastCount} past{' '}
                        {pastCount === 1 ? 'season' : 'seasons'} hidden.
                    </p>
                )}
            </div>

            <Dialog
                open={editing !== null}
                onOpenChange={(isOpen) => !isOpen && setEditing(null)}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                    {editing !== null && (
                        <SeasonForm
                            key={editing === 'new' ? 'new' : editing.id}
                            season={editing === 'new' ? null : editing}
                            onDone={() => setEditing(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

LessorSeasons.layout = {
    breadcrumbs: [{ title: 'Peak seasons', href: lessor.seasons.index() }],
};
