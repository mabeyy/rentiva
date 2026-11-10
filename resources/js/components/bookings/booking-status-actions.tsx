import { Form, router } from '@inertiajs/react';
import { parseISO } from 'date-fns';
import { MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import BookingController from '@/actions/App/Http/Controllers/Lessor/BookingController';
import { FormField } from '@/components/form-field';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { Booking, BookingStatus } from '@/types';

const actionLabels: Record<BookingStatus, string> = {
    pending: 'Mark pending',
    confirmed: 'Confirm',
    declined: 'Decline',
    cancelled: 'Cancel',
    completed: 'Mark completed',
};

/** Moves worth their own button in compact mode; the rest go in a menu. */
const buttonStatuses: BookingStatus[] = ['declined', 'confirmed', 'completed'];

/** The moves that can't be undone, so they ask first. */
type FinalStatus = 'declined' | 'cancelled' | 'completed';

const finalMoves: Record<
    FinalStatus,
    {
        title: string;
        description: string;
        button: string;
        reason: 'required' | 'optional' | null;
        placeholder?: string;
    }
> = {
    declined: {
        title: 'Decline',
        description:
            "The renter gets your reason by email and the dates open up again. This can't be undone.",
        button: 'Decline booking',
        reason: 'required',
        placeholder: 'e.g. The car is under maintenance on those dates.',
    },
    cancelled: {
        title: 'Cancel',
        description:
            "The renter is emailed and the dates open up again. If they paid, record their refund afterwards. This can't be undone.",
        button: 'Cancel booking',
        reason: 'optional',
        placeholder:
            'e.g. The car was in an accident. (Optional, the renter sees it.)',
    },
    completed: {
        title: 'Complete',
        description:
            "Marks the trip as done and asks the renter for a review. This can't be undone.",
        button: 'Mark completed',
        reason: null,
    },
};

/**
 * Buttons for every status a lessor may move the booking to next. Compact
 * mode keeps a request to Decline / Confirm, and puts a trip's rarer moves
 * in a "more" menu.
 * Declining, cancelling and completing can't be undone, so each asks first;
 * declining needs a reason, cancelling may give one, both emailed.
 */
export function BookingStatusActions({
    booking,
    compact = false,
}: {
    booking: Booking;
    compact?: boolean;
}) {
    const [pendingMove, setPendingMove] = useState<FinalStatus | null>(null);
    const isRequest = booking.status.value === 'pending';
    // A trip can only be completed once it has started.
    const hasStarted = parseISO(booking.start_date) <= new Date();
    const nextStatuses = booking.next_statuses.filter(
        ({ value }) => value !== 'completed' || hasStarted,
    );
    const buttons = nextStatuses
        .filter(({ value }) => buttonStatuses.includes(value))
        .sort(
            (a, b) =>
                buttonStatuses.indexOf(a.value) -
                buttonStatuses.indexOf(b.value),
        );
    // Declining already covers "cancel" for a request.
    const menu = nextStatuses.filter(
        ({ value }) =>
            !buttonStatuses.includes(value) &&
            !(isRequest && value === 'cancelled'),
    );

    function choose(status: BookingStatus): void {
        if (status in finalMoves) {
            setPendingMove(status as FinalStatus);
        } else {
            update(status);
        }
    }

    function update(status: BookingStatus): void {
        router.patch(
            BookingController.update.url(booking.reference),
            { status },
            {
                preserveScroll: true,
                // e.g. the request expired while the page was open.
                onError: (errors) =>
                    toast.error(
                        errors.status ?? "Couldn't update this booking.",
                    ),
            },
        );
    }

    return (
        <div
            className={cn(
                'flex justify-end gap-2',
                compact ? 'flex-nowrap items-center' : 'flex-wrap',
            )}
        >
            {compact ? (
                <>
                    {buttons.map(({ value }) => (
                        <Button
                            key={value}
                            size="sm"
                            variant={value === 'declined' ? 'ghost' : 'default'}
                            className="h-8 rounded-full px-3.5"
                            onClick={() => choose(value)}
                        >
                            {actionLabels[value]}
                        </Button>
                    ))}
                    {menu.length > 0 && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    size="icon"
                                    variant="outline"
                                    className="size-8 rounded-full"
                                    tooltip="More actions"
                                >
                                    <MoreHorizontal />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {menu.map(({ value }) => (
                                    <DropdownMenuItem
                                        key={value}
                                        variant={
                                            value === 'declined' ||
                                            value === 'cancelled'
                                                ? 'destructive'
                                                : 'default'
                                        }
                                        onSelect={() => choose(value)}
                                    >
                                        {actionLabels[value]}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </>
            ) : (
                nextStatuses.map(({ value }) => (
                    <Button
                        key={value}
                        size="sm"
                        variant={value === 'confirmed' ? 'default' : 'outline'}
                        onClick={() => choose(value)}
                    >
                        {actionLabels[value]}
                    </Button>
                ))
            )}

            <Dialog
                open={pendingMove !== null}
                onOpenChange={(isOpen) => !isOpen && setPendingMove(null)}
            >
                <DialogContent>
                    {pendingMove && (
                        <>
                            <DialogHeader>
                                <DialogTitle>
                                    {finalMoves[pendingMove].title}{' '}
                                    {booking.reference}?
                                </DialogTitle>
                                <DialogDescription>
                                    {finalMoves[pendingMove].description}
                                </DialogDescription>
                            </DialogHeader>
                            <Form
                                {...BookingController.update.form(
                                    booking.reference,
                                )}
                                options={{ preserveScroll: true }}
                                onSuccess={() => setPendingMove(null)}
                                className="space-y-4"
                            >
                                {({ processing, errors }) => (
                                    <>
                                        <input
                                            type="hidden"
                                            name="status"
                                            value={pendingMove}
                                        />
                                        {finalMoves[pendingMove].reason ? (
                                            <FormField
                                                id={`reason-${booking.id}`}
                                                label={
                                                    finalMoves[pendingMove]
                                                        .reason === 'required'
                                                        ? 'Reason'
                                                        : 'Reason (optional)'
                                                }
                                                error={
                                                    errors.reason ??
                                                    errors.status
                                                }
                                            >
                                                <Textarea
                                                    id={`reason-${booking.id}`}
                                                    name="reason"
                                                    required={
                                                        finalMoves[pendingMove]
                                                            .reason ===
                                                        'required'
                                                    }
                                                    maxLength={500}
                                                    rows={3}
                                                    placeholder={
                                                        finalMoves[pendingMove]
                                                            .placeholder
                                                    }
                                                />
                                            </FormField>
                                        ) : (
                                            errors.status && (
                                                <p className="text-sm text-destructive">
                                                    {errors.status}
                                                </p>
                                            )
                                        )}
                                        <DialogFooter>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                onClick={() =>
                                                    setPendingMove(null)
                                                }
                                            >
                                                Keep booking
                                            </Button>
                                            <Button
                                                type="submit"
                                                variant={
                                                    pendingMove === 'completed'
                                                        ? 'default'
                                                        : 'destructive'
                                                }
                                                disabled={processing}
                                            >
                                                {finalMoves[pendingMove].button}
                                            </Button>
                                        </DialogFooter>
                                    </>
                                )}
                            </Form>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
