import { router, useForm } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { CheckCircle2, Undo2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { formatPeso } from '@/lib/format';
import lessor from '@/routes/lessor';
import type { Booking } from '@/types';

/**
 * Track the refundable deposit: collected at pickup, then returned in full or
 * in part with a reason for what was kept.
 */
export function BookingDepositCard({ booking }: { booking: Booking }) {
    const deposit = booking.security_deposit;
    const [isReturning, setIsReturning] = useState(false);
    const form = useForm({
        action: 'returned',
        returned_amount: String(deposit / 100),
        note: '',
    });
    const isPartial = Number(form.data.returned_amount) * 100 < deposit;

    function submit(event: FormEvent): void {
        event.preventDefault();
        form.put(lessor.bookings.deposit.update(booking.reference).url, {
            preserveScroll: true,
            onSuccess: () => setIsReturning(false),
        });
    }

    if (booking.deposit_returned_at) {
        const kept = deposit - (booking.deposit_returned_amount ?? 0);

        return (
            <div className="space-y-1 text-sm">
                <p className="flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400">
                    <Undo2 className="size-4" />
                    {formatPeso(booking.deposit_returned_amount ?? 0)} returned
                </p>
                <p className="text-muted-foreground">
                    {format(
                        parseISO(booking.deposit_returned_at),
                        'MMM d, yyyy',
                    )}
                    {kept > 0 && ` · ${formatPeso(kept)} kept`}
                </p>
                {booking.deposit_note && (
                    <p className="text-muted-foreground">
                        {booking.deposit_note}
                    </p>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-3 text-sm">
            <p className="flex items-baseline justify-between">
                <span className="text-muted-foreground">Deposit</span>
                <span className="font-semibold tabular-nums">
                    {formatPeso(deposit)}
                </span>
            </p>
            {booking.deposit_collected_at ? (
                <p className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="size-4" /> Collected{' '}
                    {format(parseISO(booking.deposit_collected_at), 'MMM d')}
                </p>
            ) : (
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full rounded-full"
                    onClick={() =>
                        router.put(
                            lessor.bookings.deposit.update(booking.reference)
                                .url,
                            { action: 'collected' },
                            { preserveScroll: true },
                        )
                    }
                >
                    <CheckCircle2 /> Mark as collected
                </Button>
            )}

            {isReturning ? (
                <form
                    onSubmit={submit}
                    className="space-y-2 rounded-2xl border p-3"
                >
                    <label
                        className="block text-xs font-medium"
                        htmlFor="returned_amount"
                    >
                        Amount returned
                    </label>
                    <div className="relative">
                        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                            ₱
                        </span>
                        <Input
                            id="returned_amount"
                            type="number"
                            min={0}
                            max={deposit / 100}
                            step="any"
                            value={form.data.returned_amount}
                            onChange={(event) =>
                                form.setData(
                                    'returned_amount',
                                    event.target.value,
                                )
                            }
                            className="pl-7 tabular-nums"
                        />
                    </div>
                    {isPartial && (
                        <Input
                            aria-label="Why part was kept"
                            value={form.data.note}
                            onChange={(event) =>
                                form.setData('note', event.target.value)
                            }
                            placeholder="Why part was kept, e.g. scratch on the bumper"
                            maxLength={255}
                        />
                    )}
                    <InputError
                        message={
                            form.errors.returned_amount ?? form.errors.note
                        }
                    />
                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="rounded-full"
                            onClick={() => setIsReturning(false)}
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
                            Save
                        </Button>
                    </div>
                </form>
            ) : (
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full rounded-full"
                    onClick={() => setIsReturning(true)}
                >
                    <Undo2 /> Record return
                </Button>
            )}
        </div>
    );
}
