import { useForm } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { CalendarClock, Clock, Undo2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { DateRangePicker } from '@/components/date-range-picker';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { formatPeso, toIsoDate } from '@/lib/format';
import type { Booking } from '@/types';

function dates(start: string, end: string): string {
    return `${format(parseISO(start), 'MMM d')} – ${format(parseISO(end), 'MMM d, yyyy')}`;
}

/**
 * Lets a renter ask the owner to move their dates, and shows a pending
 * request. Nothing changes until the owner approves.
 */
export function RenterChangeRequest({
    booking,
    changeRequestUrl,
}: {
    booking: Booking;
    changeRequestUrl: string | null;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [range, setRange] = useState<DateRange | undefined>();
    const form = useForm({ start_date: '', end_date: '', note: '' });
    const pending = booking.change_request;

    function submit(event: FormEvent): void {
        event.preventDefault();
        form.post(changeRequestUrl!, {
            preserveScroll: true,
            onSuccess: () => setIsOpen(false),
        });
    }

    if (pending) {
        return (
            <section className="flex gap-3 rounded-3xl border p-5">
                <Clock className="mt-0.5 size-5 shrink-0 text-brand" />
                <div>
                    <p className="font-semibold">Change requested</p>
                    <p className="text-sm text-muted-foreground">
                        You asked to move to{' '}
                        {dates(pending.start_date, pending.end_date)}. The owner
                        will reply by email.
                    </p>
                </div>
            </section>
        );
    }

    if (!changeRequestUrl) {
        return null;
    }

    if (!isOpen) {
        return (
            <Button
                variant="outline"
                className="w-full rounded-full sm:w-auto"
                onClick={() => setIsOpen(true)}
            >
                <CalendarClock /> Request different dates
            </Button>
        );
    }

    return (
        <form onSubmit={submit} className="space-y-3 rounded-3xl border p-5">
            <div>
                <p className="font-semibold">Request different dates</p>
                <p className="text-sm text-muted-foreground">
                    The owner checks the car is free and replies by email. The
                    price may change.
                </p>
            </div>
            <DateRangePicker
                value={range}
                onChange={(next) => {
                    setRange(next);
                    form.setData((data) => ({
                        ...data,
                        start_date: next?.from ? toIsoDate(next.from) : '',
                        end_date: next?.to ? toIsoDate(next.to) : '',
                    }));
                }}
            />
            <InputError
                message={form.errors.start_date ?? form.errors.end_date}
            />
            <Textarea
                aria-label="Note to the owner"
                rows={2}
                maxLength={300}
                value={form.data.note}
                onChange={(event) => form.setData('note', event.target.value)}
                placeholder="Why, or anything they should know (optional)"
            />
            <div className="flex justify-end gap-2">
                <Button
                    type="button"
                    variant="ghost"
                    className="rounded-full"
                    onClick={() => setIsOpen(false)}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    className="rounded-full"
                    disabled={form.processing || !form.data.end_date}
                >
                    {form.processing && <Spinner />}
                    Send request
                </Button>
            </div>
        </form>
    );
}

/** What was refunded after a cancellation, if anything. */
export function RenterRefundNotice({ booking }: { booking: Booking }) {
    if (!booking.refunded_at) {
        return null;
    }

    return (
        <section className="flex gap-3 rounded-3xl border p-5">
            <Undo2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
            <div className="text-sm">
                <p className="font-semibold">
                    {formatPeso(booking.refund_amount ?? 0)} refunded
                </p>
                <p className="text-muted-foreground">
                    {format(parseISO(booking.refunded_at), 'MMM d, yyyy')}
                    {booking.refund_reference &&
                        ` · Reference ${booking.refund_reference}`}
                </p>
                {booking.refund_note && (
                    <p className="mt-1 text-muted-foreground">
                        {booking.refund_note}
                    </p>
                )}
            </div>
        </section>
    );
}
