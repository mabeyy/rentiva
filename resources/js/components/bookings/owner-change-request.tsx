import { router, useForm } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { CalendarClock, Undo2 } from 'lucide-react';
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
 * The renter's request to move their dates, with Approve and Decline.
 */
export function OwnerChangeRequest({ booking }: { booking: Booking }) {
    const [isDeclining, setIsDeclining] = useState(false);
    const [isApproving, setIsApproving] = useState(false);
    const form = useForm({ reason: '' });
    const request = booking.change_request;

    if (!request) {
        return null;
    }

    function approve(): void {
        router.post(
            lessor.bookings.changeRequest.approve(booking.reference).url,
            {},
            {
                preserveScroll: true,
                onStart: () => setIsApproving(true),
                onFinish: () => setIsApproving(false),
                onError: (errors) =>
                    form.setError('reason', errors.start_date ?? ''),
            },
        );
    }

    function decline(event: FormEvent): void {
        event.preventDefault();
        form.post(
            lessor.bookings.changeRequest.decline(booking.reference).url,
            {
                preserveScroll: true,
            },
        );
    }

    return (
        <div className="space-y-3 rounded-2xl border border-sky-500/40 bg-sky-500/10 p-4 text-sm">
            <div className="flex gap-3">
                <CalendarClock className="mt-0.5 size-4 shrink-0 text-sky-700 dark:text-sky-300" />
                <div className="flex-1">
                    <p>
                        <span className="font-semibold">
                            {booking.renter_name} asked to move to{' '}
                            {format(parseISO(request.start_date), 'MMM d')} –{' '}
                            {format(parseISO(request.end_date), 'MMM d, yyyy')}
                        </span>{' '}
                        <span className="text-muted-foreground">
                            (now {format(parseISO(booking.start_date), 'MMM d')}{' '}
                            – {format(parseISO(booking.end_date), 'MMM d')})
                        </span>
                    </p>
                    {request.note && (
                        <p className="mt-1 text-muted-foreground">
                            “{request.note}”
                        </p>
                    )}
                </div>
            </div>
            {isDeclining ? (
                <form onSubmit={decline} className="flex flex-wrap gap-2 pl-7">
                    <Input
                        aria-label="Why you can't"
                        className="h-9 min-w-56 flex-1 bg-background"
                        placeholder="Why you can't, e.g. the car is booked then"
                        value={form.data.reason}
                        onChange={(event) =>
                            form.setData('reason', event.target.value)
                        }
                        autoFocus
                        required
                    />
                    <Button
                        type="submit"
                        size="sm"
                        className="h-9 rounded-full"
                        disabled={form.processing}
                    >
                        Send
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-9 rounded-full"
                        onClick={() => setIsDeclining(false)}
                    >
                        Cancel
                    </Button>
                </form>
            ) : (
                <div className="flex gap-2 pl-7">
                    <Button
                        size="sm"
                        className="rounded-full"
                        disabled={isApproving}
                        onClick={approve}
                    >
                        {isApproving && <Spinner />}
                        Approve new dates
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full"
                        onClick={() => setIsDeclining(true)}
                    >
                        Decline
                    </Button>
                </div>
            )}
            <InputError message={form.errors.reason} className="pl-7" />
        </div>
    );
}

/**
 * After a paid booking is cancelled or declined: record the refund, or show
 * what was refunded.
 */
export function BookingRefundCard({ booking }: { booking: Booking }) {
    const paid = booking.amount_paid;
    const form = useForm({
        amount: String(paid / 100),
        reference: '',
        note: '',
    });
    const isPartial = Number(form.data.amount) * 100 < paid;

    if (booking.refunded_at) {
        return (
            <div className="space-y-1 text-sm">
                <p className="flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400">
                    <Undo2 className="size-4" />
                    {formatPeso(booking.refund_amount ?? 0)} refunded
                </p>
                <p className="text-muted-foreground">
                    {format(parseISO(booking.refunded_at), 'MMM d, yyyy')}
                    {booking.refund_reference &&
                        ` · ${booking.refund_reference}`}
                    {paid - (booking.refund_amount ?? 0) > 0 &&
                        ` · ${formatPeso(paid - (booking.refund_amount ?? 0))} kept`}
                </p>
                {booking.refund_note && (
                    <p className="text-muted-foreground">
                        {booking.refund_note}
                    </p>
                )}
            </div>
        );
    }

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                form.put(lessor.bookings.refund.update(booking.reference).url, {
                    preserveScroll: true,
                });
            }}
            className="space-y-2 text-sm"
        >
            <p className="text-muted-foreground">
                The renter paid {formatPeso(paid)}. Record what you sent back.
            </p>
            <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                    <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">
                        ₱
                    </span>
                    <Input
                        aria-label="Amount refunded"
                        type="number"
                        min={0}
                        max={paid / 100}
                        step="any"
                        value={form.data.amount}
                        onChange={(event) =>
                            form.setData('amount', event.target.value)
                        }
                        className="pl-7 tabular-nums"
                    />
                </div>
                <Input
                    aria-label="Reference"
                    placeholder="Reference"
                    value={form.data.reference}
                    onChange={(event) =>
                        form.setData('reference', event.target.value)
                    }
                />
            </div>
            {isPartial && (
                <Input
                    aria-label="Why part was kept"
                    placeholder="Why part was kept, e.g. cancellation fee"
                    value={form.data.note}
                    onChange={(event) =>
                        form.setData('note', event.target.value)
                    }
                />
            )}
            <InputError
                message={
                    form.errors.amount ??
                    form.errors.note ??
                    form.errors.reference
                }
            />
            <Button
                type="submit"
                size="sm"
                className="w-full rounded-full"
                disabled={form.processing}
            >
                {form.processing && <Spinner />}
                Record refund
            </Button>
        </form>
    );
}
