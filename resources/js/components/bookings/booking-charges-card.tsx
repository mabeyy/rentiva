import { router, useForm } from '@inertiajs/react';
import { Plus, X } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { formatPeso } from '@/lib/format';
import { cn } from '@/lib/utils';
import lessor from '@/routes/lessor';
import type { Booking } from '@/types';
import { Hint } from '@/components/info-tip';

/**
 * Charges added after booking, such as a late return, fuel or damage. Each
 * one is added to the total and shows on the receipt.
 */
export function BookingChargesCard({
    booking,
    suggestedLabels,
}: {
    booking: Booking;
    suggestedLabels: string[];
}) {
    const [isAdding, setIsAdding] = useState(false);
    const form = useForm({ label: '', amount: '' });
    const charges = booking.charges ?? [];

    function submit(event: FormEvent): void {
        event.preventDefault();
        form.post(lessor.bookings.charges.store(booking.reference).url, {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                setIsAdding(false);
            },
        });
    }

    return (
        <div className="space-y-3">
            {charges.length > 0 && (
                <ul className="divide-y rounded-2xl border text-sm">
                    {charges.map((charge) => (
                        <li
                            key={charge.id}
                            className="flex items-center justify-between gap-3 px-3 py-2"
                        >
                            <span>{charge.label}</span>
                            <span className="flex items-center gap-1 tabular-nums">
                                {formatPeso(charge.amount)}
                                <Hint text="Remove charge">
                                    <button
                                        type="button"
                                        aria-label={`Remove ${charge.label}`}
                                        className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                                        onClick={() =>
                                            router.delete(
                                                lessor.bookings.charges.destroy(
                                                    {
                                                        booking:
                                                            booking.reference,
                                                        charge: charge.id,
                                                    },
                                                ).url,
                                                { preserveScroll: true },
                                            )
                                        }
                                    >
                                        <X className="size-3.5" />
                                    </button>
                                </Hint>
                            </span>
                        </li>
                    ))}
                </ul>
            )}

            {isAdding ? (
                <form
                    onSubmit={submit}
                    className="space-y-3 rounded-2xl border p-3"
                >
                    <div className="flex flex-wrap gap-1.5">
                        {suggestedLabels.map((label) => (
                            <button
                                key={label}
                                type="button"
                                onClick={() => form.setData('label', label)}
                                className={cn(
                                    'rounded-full border px-2.5 py-1 text-xs transition-colors',
                                    form.data.label === label
                                        ? 'border-brand bg-brand/10 text-brand'
                                        : 'text-muted-foreground hover:text-foreground',
                                )}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    <div className="grid grid-cols-[1fr_8rem] gap-2">
                        <Input
                            aria-label="What it's for"
                            value={form.data.label}
                            onChange={(event) =>
                                form.setData('label', event.target.value)
                            }
                            placeholder="What it's for"
                            maxLength={80}
                        />
                        <div className="relative">
                            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                                ₱
                            </span>
                            <Input
                                aria-label="Amount"
                                type="number"
                                min={1}
                                step="any"
                                value={form.data.amount}
                                onChange={(event) =>
                                    form.setData('amount', event.target.value)
                                }
                                className="pl-7 tabular-nums"
                            />
                        </div>
                    </div>
                    <InputError
                        message={form.errors.label ?? form.errors.amount}
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
                            Add charge
                        </Button>
                    </div>
                </form>
            ) : (
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full rounded-full border-dashed"
                    onClick={() => setIsAdding(true)}
                >
                    <Plus /> Add a charge
                </Button>
            )}
        </div>
    );
}
