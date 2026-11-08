import { useForm } from '@inertiajs/react';
import {
    addDays,
    differenceInCalendarDays,
    eachDayOfInterval,
    format,
    parseISO,
    subDays,
} from 'date-fns';
import type { FormEvent } from 'react';
import { useState } from 'react';
import type { DateRange, Matcher } from 'react-day-picker';
import CarBlockController from '@/actions/App/Http/Controllers/Lessor/CarBlockController';
import { FormField } from '@/components/form-field';
import InputError from '@/components/input-error';
import { OptionSelect } from '@/components/option-select';
import { BrandButton } from '@/components/public/brand-button';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { toIsoDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { BookedRange, CarBlock, Option } from '@/types';

/** What the dialog needs to offer cars and grey out taken days. */
export type BlockOptions = {
    cars: { slug: string; name: string }[];
    reasons: Option[];
    /** Each car's upcoming rentals, by car slug. */
    bookedRanges: Record<string, BookedRange[]>;
    /** Every upcoming block across the owner's cars. */
    blocks: CarBlock[];
};

/** e.g. "Nov 12 – 14, 2026" or "Nov 12, 2026" for a single day. */
export function blockPeriod(block: Pick<CarBlock, 'start_date' | 'end_date'>) {
    const start = parseISO(block.start_date);
    const end = parseISO(block.end_date);

    if (block.start_date === block.end_date) {
        return format(start, 'MMM d, yyyy');
    }

    if (start.getFullYear() !== end.getFullYear()) {
        return `${format(start, 'MMM d, yyyy')} – ${format(end, 'MMM d, yyyy')}`;
    }

    return start.getMonth() === end.getMonth()
        ? `${format(start, 'MMM d')} – ${format(end, 'd, yyyy')}`
        : `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
}

export function blockDayCount(from: Date, to: Date): string {
    const days = differenceInCalendarDays(to, from) + 1;

    return `${days} ${days === 1 ? 'day' : 'days'}`;
}

/**
 * Block a car's dates, or edit a block. New blocks pick the car here, with
 * an optional car and first day filled in already.
 */
export function BlockDatesDialog({
    open,
    onOpenChange,
    block = null,
    initialCarSlug,
    initialDate,
    options,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    block?: CarBlock | null;
    initialCarSlug?: string | null;
    initialDate?: string | null;
    options: BlockOptions;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                {open && (
                    <BlockForm
                        key={block?.id ?? 'new'}
                        block={block}
                        initialCarSlug={initialCarSlug}
                        initialDate={initialDate}
                        options={options}
                        onDone={() => onOpenChange(false)}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}

function BlockForm({
    block,
    initialCarSlug,
    initialDate,
    options,
    onDone,
}: {
    block: CarBlock | null;
    initialCarSlug?: string | null;
    initialDate?: string | null;
    options: BlockOptions;
    onDone: () => void;
}) {
    const [carSlug, setCarSlug] = useState<string | null>(
        block?.car?.slug ??
            initialCarSlug ??
            (options.cars.length === 1 ? options.cars[0].slug : null),
    );
    const [range, setRange] = useState<DateRange | undefined>(() => {
        if (block) {
            return {
                from: parseISO(block.start_date),
                to: parseISO(block.end_date),
            };
        }

        return initialDate ? { from: parseISO(initialDate) } : undefined;
    });
    const reasons = options.reasons;
    const bookedRanges = carSlug ? (options.bookedRanges[carSlug] ?? []) : [];
    const otherBlocks = options.blocks.filter(
        (other) => other.car?.slug === carSlug && other.id !== block?.id,
    );
    const form = useForm({
        start_date: block?.start_date ?? initialDate ?? '',
        end_date: block?.end_date ?? initialDate ?? '',
        reason: block?.reason.value ?? reasons[0]?.value ?? '',
        note: block?.note ?? '',
    });

    const today = new Date(new Date().setHours(0, 0, 0, 0));
    /** A rental holds the car from pickup until the morning of its return. */
    const takenRanges = [
        ...bookedRanges.map((booked) => ({
            from: parseISO(booked.start_date),
            to: subDays(parseISO(booked.end_date), 1),
        })),
        ...otherBlocks.map((other) => ({
            from: parseISO(other.start_date),
            to: parseISO(other.end_date),
        })),
    ];
    const unavailable: Matcher[] = [{ before: today }, ...takenRanges];

    function isUnavailable(day: Date): boolean {
        return (
            day < today ||
            takenRanges.some((taken) => day >= taken.from && day <= taken.to)
        );
    }

    /** First click starts a range; the second ends it, unless it would cross a taken day. */
    function select(_next: DateRange | undefined, clickedDay: Date): void {
        const startsNew =
            !range?.from || range.to !== undefined || clickedDay < range.from;
        const crossesTakenDay =
            !startsNew &&
            eachDayOfInterval({ start: range!.from!, end: clickedDay }).some(
                isUnavailable,
            );
        const next =
            startsNew || crossesTakenDay
                ? { from: clickedDay, to: undefined }
                : { from: range!.from, to: clickedDay };

        setRange(next);
        form.setData((data) => ({
            ...data,
            start_date: toIsoDate(next.from!),
            end_date: toIsoDate(next.to ?? next.from!),
        }));
    }

    function submit(event: FormEvent): void {
        event.preventDefault();

        if (!carSlug) {
            return;
        }

        const visit = { preserveScroll: true, onSuccess: onDone };

        if (block) {
            form.put(
                CarBlockController.update({ car: carSlug, block: block.id })
                    .url,
                visit,
            );
        } else {
            form.post(CarBlockController.store(carSlug).url, visit);
        }
    }

    const from = range?.from;
    const to = range?.to ?? range?.from;

    return (
        <form onSubmit={submit} className="space-y-5">
            <DialogHeader>
                <DialogTitle>
                    {block ? 'Edit blocked dates' : 'Block dates'}
                </DialogTitle>
                <DialogDescription>
                    Pick the first and last day the car is unavailable. Days
                    that are booked or already blocked are greyed out.
                </DialogDescription>
            </DialogHeader>

            {block ? (
                <p className="text-sm font-medium">{block.car?.name}</p>
            ) : (
                <FormField id="block_car" label="Car">
                    <OptionSelect
                        id="block_car"
                        options={options.cars.map((car) => ({
                            value: car.slug,
                            label: car.name,
                        }))}
                        value={carSlug}
                        onChange={(value) => {
                            setCarSlug(value);
                            setRange(undefined);
                            form.setData((data) => ({
                                ...data,
                                start_date: '',
                                end_date: '',
                            }));
                        }}
                        placeholder="Choose a car"
                    />
                </FormField>
            )}

            <div
                className={cn(
                    'rounded-2xl border',
                    !carSlug && 'pointer-events-none opacity-50',
                )}
            >
                <Calendar
                    mode="range"
                    selected={range}
                    onSelect={select}
                    disabled={unavailable}
                    defaultMonth={from ?? new Date()}
                    startMonth={new Date()}
                    endMonth={addDays(new Date(), 365)}
                    className="mx-auto"
                />
                <p className="border-t px-4 py-2.5 text-center text-sm tabular-nums">
                    {from && to ? (
                        <>
                            <span className="font-medium">
                                {blockPeriod({
                                    start_date: toIsoDate(from),
                                    end_date: toIsoDate(to),
                                })}
                            </span>
                            <span className="text-muted-foreground">
                                {' '}
                                · {blockDayCount(from, to)}
                            </span>
                        </>
                    ) : (
                        <span className="text-muted-foreground">
                            No days picked yet
                        </span>
                    )}
                </p>
            </div>
            <InputError
                message={form.errors.start_date ?? form.errors.end_date}
            />

            <FormField id="reason" label="Reason" error={form.errors.reason}>
                <div className="flex flex-wrap gap-2">
                    {reasons.map((reason) => (
                        <button
                            key={reason.value}
                            type="button"
                            aria-pressed={form.data.reason === reason.value}
                            onClick={() => form.setData('reason', reason.value)}
                            className={cn(
                                'rounded-full border px-3.5 py-1.5 text-sm transition-colors',
                                form.data.reason === reason.value
                                    ? 'border-brand bg-brand/10 font-medium text-brand'
                                    : 'text-muted-foreground hover:border-foreground/30 hover:text-foreground',
                            )}
                        >
                            {reason.label}
                        </button>
                    ))}
                </div>
            </FormField>

            <FormField
                id="note"
                label="Note (optional)"
                error={form.errors.note}
                hint="Only you see this."
            >
                <Input
                    id="note"
                    maxLength={120}
                    value={form.data.note}
                    onChange={(event) =>
                        form.setData('note', event.target.value)
                    }
                    placeholder="e.g. Change oil, PMS at Toyota Banilad"
                />
            </FormField>

            <div className="flex justify-end gap-2">
                <Button
                    type="button"
                    variant="ghost"
                    className="rounded-full"
                    onClick={onDone}
                >
                    Cancel
                </Button>
                <BrandButton
                    type="submit"
                    disabled={form.processing || !from || !carSlug}
                    className="rounded-full"
                >
                    {form.processing && <Spinner />}
                    {block ? 'Save' : 'Block dates'}
                </BrandButton>
            </div>
        </form>
    );
}
