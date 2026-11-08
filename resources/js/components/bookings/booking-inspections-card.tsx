import { useForm } from '@inertiajs/react';
import { Camera, ClipboardCheck, Fuel, Gauge, Pencil } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { FormField } from '@/components/form-field';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import { UpgradeNote } from '@/components/lessor/upgrade-note';
import { usePlanFeature } from '@/hooks/use-plan-feature';
import { cn } from '@/lib/utils';
import lessor from '@/routes/lessor';
import type { Booking, BookingInspection } from '@/types';

type CheckType = 'pickup' | 'return';

const titles: Record<CheckType, string> = {
    pickup: 'At pickup',
    return: 'At return',
};

/** Eight segments showing how full the tank is. */
function FuelGauge({ level }: { level: number }) {
    return (
        <span className="flex gap-0.5" aria-label={`Fuel ${level} of 8`}>
            {Array.from({ length: 8 }, (_, index) => (
                <span
                    key={index}
                    className={cn(
                        'h-2.5 w-2 rounded-sm',
                        index < level ? 'bg-brand' : 'bg-muted',
                    )}
                />
            ))}
        </span>
    );
}

function CheckSummary({
    booking,
    type,
    check,
}: {
    booking: Booking;
    type: CheckType;
    check: BookingInspection;
}) {
    return (
        <div className="space-y-2 text-sm">
            <p className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Fuel className="size-3.5" /> Fuel
                </span>
                <FuelGauge level={check.fuel_level} />
            </p>
            <p className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Gauge className="size-3.5" /> Odometer
                </span>
                <span className="tabular-nums">
                    {check.odometer.toLocaleString()} km
                </span>
            </p>
            {check.notes && (
                <p className="text-muted-foreground">{check.notes}</p>
            )}
            {check.photo_count > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                    {Array.from({ length: check.photo_count }, (_, index) => {
                        const url = lessor.bookings.inspections.photo({
                            booking: booking.reference,
                            inspection: check.id,
                            index,
                        }).url;

                        return (
                            <a
                                key={index}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block size-14 overflow-hidden rounded-lg border"
                            >
                                <img
                                    src={url}
                                    alt={`${titles[type]} photo ${index + 1}`}
                                    className="size-full object-cover"
                                />
                            </a>
                        );
                    })}
                </div>
            )}
            <p className="text-xs text-muted-foreground">
                By {check.recorded_by}
            </p>
        </div>
    );
}

function CheckDialog({
    booking,
    type,
    check,
    onClose,
}: {
    booking: Booking;
    type: CheckType;
    check: BookingInspection | undefined;
    onClose: () => void;
}) {
    const form = useForm<{
        type: CheckType;
        fuel_level: number;
        odometer: string;
        notes: string;
        photos: File[];
    }>({
        type,
        fuel_level: check?.fuel_level ?? 8,
        odometer: check ? String(check.odometer) : '',
        notes: check?.notes ?? '',
        photos: [],
    });

    function submit(event: FormEvent): void {
        event.preventDefault();
        form.post(lessor.bookings.inspections.store(booking.reference).url, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: onClose,
        });
    }

    return (
        <form onSubmit={submit} className="space-y-4">
            <DialogHeader>
                <DialogTitle>
                    {type === 'pickup' ? 'Pickup check' : 'Return check'}
                </DialogTitle>
                <DialogDescription>
                    Record the car's condition{' '}
                    {type === 'pickup'
                        ? 'as you hand it over'
                        : 'when it comes back'}
                    . Photos protect you both if there's a dispute.
                </DialogDescription>
            </DialogHeader>

            <FormField
                id="fuel_level"
                label="Fuel"
                error={form.errors.fuel_level}
            >
                <div className="flex gap-1">
                    {Array.from({ length: 9 }, (_, level) => (
                        <button
                            key={level}
                            type="button"
                            aria-pressed={form.data.fuel_level === level}
                            onClick={() => form.setData('fuel_level', level)}
                            className={cn(
                                'h-9 flex-1 rounded-md border text-xs font-medium tabular-nums transition-colors',
                                level <= form.data.fuel_level
                                    ? 'border-brand bg-brand/10 text-brand'
                                    : 'text-muted-foreground',
                            )}
                        >
                            {level === 0 ? 'E' : level === 8 ? 'F' : level}
                        </button>
                    ))}
                </div>
            </FormField>
            <FormField
                id="odometer"
                label="Odometer"
                error={form.errors.odometer}
            >
                <div className="relative">
                    <Input
                        id="odometer"
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={form.data.odometer}
                        onChange={(event) =>
                            form.setData('odometer', event.target.value)
                        }
                        className="pr-10 tabular-nums"
                        required
                    />
                    <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">
                        km
                    </span>
                </div>
            </FormField>
            <FormField
                id="check_notes"
                label="Notes (optional)"
                error={form.errors.notes}
            >
                <Textarea
                    id="check_notes"
                    rows={2}
                    value={form.data.notes}
                    onChange={(event) =>
                        form.setData('notes', event.target.value)
                    }
                    placeholder="Scratches, dents, missing items…"
                />
            </FormField>
            <FormField
                id="check_photos"
                label="Photos (up to 8)"
                error={form.errors.photos}
                hint={
                    check?.photo_count
                        ? 'New photos replace the saved ones.'
                        : undefined
                }
            >
                <Input
                    id="check_photos"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={(event) =>
                        form.setData(
                            'photos',
                            Array.from(event.target.files ?? []).slice(0, 8),
                        )
                    }
                />
            </FormField>
            <InputError
                message={
                    Object.entries(form.errors).find(([key]) =>
                        key.startsWith('photos.'),
                    )?.[1]
                }
            />
            <DialogFooter>
                <Button type="submit" disabled={form.processing}>
                    {form.processing && <Spinner />}
                    Save check
                </Button>
            </DialogFooter>
        </form>
    );
}

/**
 * Pickup and return checks side by side, with the distance driven and the
 * fuel difference once both are in.
 */
export function BookingInspectionsCard({ booking }: { booking: Booking }) {
    const canRecord = usePlanFeature('inspections');
    const [editing, setEditing] = useState<CheckType | null>(null);
    const pickup = booking.inspections?.pickup;
    const returned = booking.inspections?.return;

    return (
        <>
            <div className="grid gap-4 sm:grid-cols-2">
                {(['pickup', 'return'] as const).map((type) => {
                    const check = type === 'pickup' ? pickup : returned;

                    return (
                        <div key={type} className="rounded-2xl border p-4">
                            <div className="mb-3 flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold">
                                    {titles[type]}
                                </p>
                                {check && canRecord && (
                                    <button
                                        type="button"
                                        aria-label={`Edit ${titles[type].toLowerCase()} check`}
                                        className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                                        onClick={() => setEditing(type)}
                                    >
                                        <Pencil className="size-3.5" />
                                    </button>
                                )}
                            </div>
                            {check ? (
                                <CheckSummary
                                    booking={booking}
                                    type={type}
                                    check={check}
                                />
                            ) : canRecord ? (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full rounded-full border-dashed"
                                    onClick={() => setEditing(type)}
                                >
                                    {type === 'pickup' ? (
                                        <Camera />
                                    ) : (
                                        <ClipboardCheck />
                                    )}
                                    Record {type} check
                                </Button>
                            ) : (
                                <UpgradeNote plans="Fleet">
                                    Photo checks are on Fleet
                                </UpgradeNote>
                            )}
                        </div>
                    );
                })}
            </div>
            {pickup && returned && (
                <p className="mt-3 text-sm text-muted-foreground">
                    Driven{' '}
                    <span className="font-medium text-foreground tabular-nums">
                        {Math.max(
                            0,
                            returned.odometer - pickup.odometer,
                        ).toLocaleString()}{' '}
                        km
                    </span>
                    {returned.fuel_level < pickup.fuel_level && (
                        <>
                            {' '}
                            · came back with{' '}
                            <span className="font-medium text-amber-700 dark:text-amber-400">
                                {pickup.fuel_level - returned.fuel_level}/8 less
                                fuel
                            </span>
                        </>
                    )}
                </p>
            )}

            <Dialog
                open={editing !== null}
                onOpenChange={(isOpen) => !isOpen && setEditing(null)}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
                    {editing && (
                        <CheckDialog
                            key={editing}
                            booking={booking}
                            type={editing}
                            check={editing === 'pickup' ? pickup : returned}
                            onClose={() => setEditing(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
