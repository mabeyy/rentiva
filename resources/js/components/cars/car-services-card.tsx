import { router, useForm } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { Plus, Wrench, X } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { FormSection } from '@/components/lessor/form-section';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { formatPeso, toIsoDate } from '@/lib/format';
import lessor from '@/routes/lessor';

export type CarServiceEntry = {
    id: number;
    serviced_on: string;
    odometer: number | null;
    description: string;
    cost: number | null;
};

/**
 * The car's maintenance log: what was done, when, at what mileage and cost.
 */
export function CarServicesCard({
    carSlug,
    services,
}: {
    carSlug: string;
    services: CarServiceEntry[];
}) {
    const [isAdding, setIsAdding] = useState(false);
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
            onSuccess: () => {
                form.reset();
                setIsAdding(false);
            },
        });
    }

    return (
        <FormSection
            title="Service history"
            description="Oil changes, repairs and new tires, so you know when the next one is due."
        >
            <div className="space-y-3">
                {services.length > 0 && (
                    <ul className="divide-y rounded-2xl border">
                        {services.map((service) => (
                            <li
                                key={service.id}
                                className="flex items-center gap-3 px-4 py-3"
                            >
                                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                    <Wrench className="size-4" />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium">
                                        {service.description}
                                    </p>
                                    <p className="text-xs text-muted-foreground tabular-nums">
                                        {format(
                                            parseISO(service.serviced_on),
                                            'MMM d, yyyy',
                                        )}
                                        {service.odometer !== null &&
                                            ` · ${service.odometer.toLocaleString()} km`}
                                        {service.cost !== null &&
                                            ` · ${formatPeso(service.cost)}`}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    aria-label={`Remove ${service.description}`}
                                    className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                                    onClick={() =>
                                        router.delete(
                                            lessor.cars.services.destroy({
                                                car: carSlug,
                                                service: service.id,
                                            }).url,
                                            { preserveScroll: true },
                                        )
                                    }
                                >
                                    <X className="size-4" />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}

                {isAdding ? (
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
                        <div className="grid gap-3 sm:grid-cols-3">
                            <Input
                                aria-label="Date"
                                type="date"
                                value={form.data.serviced_on}
                                onChange={(event) =>
                                    form.setData(
                                        'serviced_on',
                                        event.target.value,
                                    )
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
                        </div>
                        <InputError
                            message={
                                form.errors.description ??
                                form.errors.serviced_on ??
                                form.errors.odometer ??
                                form.errors.cost
                            }
                        />
                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="rounded-full"
                                onClick={() => setIsAdding(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                className="rounded-full"
                                disabled={form.processing}
                            >
                                {form.processing && <Spinner />}
                                Log service
                            </Button>
                        </div>
                    </form>
                ) : (
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full rounded-2xl border-dashed"
                        onClick={() => setIsAdding(true)}
                    >
                        <Plus /> Log a service
                    </Button>
                )}
            </div>
        </FormSection>
    );
}
