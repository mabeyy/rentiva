import { router, useForm } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { Plus, Wrench, X } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
import { formatPeso, toIsoDate } from '@/lib/format';
import lessor from '@/routes/lessor';
import { Hint } from '@/components/info-tip';

export type CarServiceEntry = {
    id: number;
    serviced_on: string;
    odometer: number | null;
    description: string;
    cost: number | null;
};

/**
 * Log a service and see a car's full maintenance history. Entries save
 * right away, separate from the listing form.
 */
export function ServiceLogDialog({
    carSlug,
    services,
    title = 'Service history',
    open,
    onOpenChange,
}: {
    carSlug: string;
    services: CarServiceEntry[];
    title?: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const form = useForm({
        serviced_on: toIsoDate(new Date()),
        odometer: '',
        description: '',
        cost: '',
    });

    function submit(event: FormEvent): void {
        event.preventDefault();
        form.post(lessor.cars.services.store(carSlug).url, {
            preserveScroll: true,
            onSuccess: () => form.reset(),
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        Oil changes, repairs and new tires. Saved right away,
                        separate from the listing.
                    </DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={submit}
                    className="space-y-3 rounded-2xl border p-4"
                >
                    <Input
                        aria-label="What was done"
                        value={form.data.description}
                        onChange={(event) =>
                            form.setData('description', event.target.value)
                        }
                        placeholder="e.g. Change oil and filter"
                        maxLength={160}
                        required
                    />
                    <div className="grid gap-3 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
                        <Input
                            aria-label="Date"
                            type="date"
                            value={form.data.serviced_on}
                            onChange={(event) =>
                                form.setData('serviced_on', event.target.value)
                            }
                        />
                        <Input
                            aria-label="Odometer in km"
                            type="number"
                            min={0}
                            value={form.data.odometer}
                            onChange={(event) =>
                                form.setData('odometer', event.target.value)
                            }
                            placeholder="Odometer (km)"
                        />
                        <Input
                            aria-label="Cost in pesos"
                            type="number"
                            min={0}
                            step="any"
                            value={form.data.cost}
                            onChange={(event) =>
                                form.setData('cost', event.target.value)
                            }
                            placeholder="Cost (₱)"
                        />
                        <Button
                            type="submit"
                            className="h-9 rounded-full"
                            disabled={form.processing}
                        >
                            {form.processing && <Spinner />}
                            Log service
                        </Button>
                    </div>
                    <InputError
                        message={
                            form.errors.description ??
                            form.errors.serviced_on ??
                            form.errors.odometer ??
                            form.errors.cost
                        }
                    />
                </form>

                {services.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Service</TableHead>
                                <TableHead className="text-right">
                                    Odometer
                                </TableHead>
                                <TableHead className="text-right">
                                    Cost
                                </TableHead>
                                <TableHead className="w-10">
                                    <span className="sr-only">Remove</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {services.map((service) => (
                                <TableRow key={service.id}>
                                    <TableCell className="whitespace-nowrap tabular-nums">
                                        {format(
                                            parseISO(service.serviced_on),
                                            'MMM d, yyyy',
                                        )}
                                    </TableCell>
                                    <TableCell className="max-w-48 truncate font-medium">
                                        {service.description}
                                    </TableCell>
                                    <TableCell className="text-right whitespace-nowrap tabular-nums">
                                        {service.odometer !== null
                                            ? `${service.odometer.toLocaleString()} km`
                                            : '–'}
                                    </TableCell>
                                    <TableCell className="text-right whitespace-nowrap tabular-nums">
                                        {service.cost !== null
                                            ? formatPeso(service.cost)
                                            : '–'}
                                    </TableCell>
                                    <TableCell>
                                        <Hint text="Remove">
                                            <button
                                                type="button"
                                                aria-label={`Remove ${service.description}`}
                                                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                                                onClick={() =>
                                                    router.delete(
                                                        lessor.cars.services.destroy(
                                                            {
                                                                car: carSlug,
                                                                service:
                                                                    service.id,
                                                            },
                                                        ).url,
                                                        {
                                                            preserveScroll: true,
                                                        },
                                                    )
                                                }
                                            >
                                                <X className="size-4" />
                                            </button>
                                        </Hint>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <p className="text-center text-sm text-muted-foreground">
                        Nothing logged yet.
                    </p>
                )}
            </DialogContent>
        </Dialog>
    );
}

/**
 * The car's maintenance log as a small sidebar card: the latest service at a
 * glance, with logging and the full list in a pop-up.
 */
export function CarServicesCard({
    carSlug,
    services,
}: {
    carSlug: string;
    services: CarServiceEntry[];
}) {
    const [isOpen, setIsOpen] = useState(false);
    const latest = services[0];

    return (
        <section className="rounded-3xl border bg-background p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Wrench className="size-4 text-muted-foreground" />
                Service history
            </h2>
            {latest ? (
                <div className="mt-3 text-sm">
                    <p className="text-xs text-muted-foreground">
                        Last service
                    </p>
                    <p className="truncate font-medium">{latest.description}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                        {format(parseISO(latest.serviced_on), 'MMM d, yyyy')}
                        {latest.odometer !== null &&
                            ` · ${latest.odometer.toLocaleString()} km`}
                    </p>
                </div>
            ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                    Log oil changes, repairs and new tires, so you know when the
                    next one is due.
                </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => setIsOpen(true)}
                >
                    <Plus /> Log a service
                </Button>
                {services.length > 0 && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="rounded-full"
                        onClick={() => setIsOpen(true)}
                    >
                        See all ({services.length})
                    </Button>
                )}
            </div>

            <ServiceLogDialog
                carSlug={carSlug}
                services={services}
                open={isOpen}
                onOpenChange={setIsOpen}
            />
        </section>
    );
}
