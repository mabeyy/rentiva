import { Head, router, useForm } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
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

const suggestions = [
    { name: 'Christmas & New Year', rate_change: 30 },
    { name: 'Holy Week', rate_change: 25 },
    { name: 'Summer', rate_change: 15 },
    { name: 'Rainy season', rate_change: -10 },
];

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
                    {suggestions.map((suggestion) => (
                        <button
                            key={suggestion.name}
                            type="button"
                            onClick={() =>
                                form.setData((data) => ({
                                    ...data,
                                    name: suggestion.name,
                                    rate_change: String(suggestion.rate_change),
                                }))
                            }
                            className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                        >
                            {suggestion.name}
                        </button>
                    ))}
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

            <div className="rounded-2xl border">
                <Calendar
                    mode="range"
                    selected={range}
                    onSelect={chooseRange}
                    defaultMonth={range?.from ?? new Date()}
                    className="mx-auto"
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

            <div className="mx-auto w-full max-w-4xl space-y-6 p-4 md:p-8">
                <PageHeader
                    eyebrow="Pricing"
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
                    <ul className="divide-y rounded-3xl border bg-background">
                        {seasons.map((season) => {
                            const isUp = season.rate_change > 0;

                            return (
                                <li
                                    key={season.id}
                                    className="flex items-center gap-4 px-5 py-4"
                                >
                                    <span
                                        className={cn(
                                            'flex h-9 min-w-16 items-center justify-center rounded-full px-3 text-sm font-bold tabular-nums',
                                            isUp
                                                ? 'bg-brand/10 text-brand'
                                                : 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
                                        )}
                                    >
                                        {isUp ? '+' : '−'}
                                        {Math.abs(season.rate_change)}%
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-medium">
                                            {season.name}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {period(season)}
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        aria-label={`Edit ${season.name}`}
                                        onClick={() => setEditing(season)}
                                    >
                                        <Pencil />
                                    </Button>
                                    <ConfirmDialog
                                        trigger={
                                            <Button
                                                variant="ghost"
                                                size="icon"
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
                                                { preserveScroll: true },
                                            )
                                        }
                                    />
                                </li>
                            );
                        })}
                    </ul>
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
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
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
