import { Form, router } from '@inertiajs/react';
import { MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
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

/**
 * Buttons for every status a lessor may move the booking to next. Compact
 * mode keeps a request to Decline / Confirm, and puts a trip's rarer moves
 * in a "more" menu.
 * Declining asks for a reason that is emailed to the renter.
 */
export function BookingStatusActions({
    booking,
    compact = false,
}: {
    booking: Booking;
    compact?: boolean;
}) {
    const [isDeclineOpen, setIsDeclineOpen] = useState(false);
    const isRequest = booking.status.value === 'pending';
    const buttons = booking.next_statuses
        .filter(({ value }) => buttonStatuses.includes(value))
        .sort(
            (a, b) =>
                buttonStatuses.indexOf(a.value) -
                buttonStatuses.indexOf(b.value),
        );
    // Declining already covers "cancel" for a request.
    const menu = booking.next_statuses.filter(
        ({ value }) =>
            !buttonStatuses.includes(value) &&
            !(isRequest && value === 'cancelled'),
    );

    function choose(status: BookingStatus): void {
        if (status === 'declined') {
            setIsDeclineOpen(true);
        } else {
            update(status);
        }
    }

    function update(status: BookingStatus): void {
        router.patch(
            BookingController.update.url(booking.reference),
            { status },
            { preserveScroll: true },
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
                                    aria-label="More actions"
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
                booking.next_statuses.map(({ value }) => (
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

            <Dialog open={isDeclineOpen} onOpenChange={setIsDeclineOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Decline {booking.reference}?</DialogTitle>
                        <DialogDescription>
                            The renter will receive your reason by email.
                        </DialogDescription>
                    </DialogHeader>
                    <Form
                        {...BookingController.update.form(booking.reference)}
                        options={{ preserveScroll: true }}
                        onSuccess={() => setIsDeclineOpen(false)}
                        className="space-y-4"
                    >
                        {({ processing, errors }) => (
                            <>
                                <input
                                    type="hidden"
                                    name="status"
                                    value="declined"
                                />
                                <FormField
                                    id={`reason-${booking.id}`}
                                    label="Reason"
                                    error={errors.reason ?? errors.status}
                                >
                                    <Textarea
                                        id={`reason-${booking.id}`}
                                        name="reason"
                                        required
                                        rows={3}
                                        placeholder="e.g. The car is under maintenance on those dates."
                                    />
                                </FormField>
                                <DialogFooter>
                                    <Button
                                        type="submit"
                                        variant="destructive"
                                        disabled={processing}
                                    >
                                        Decline booking
                                    </Button>
                                </DialogFooter>
                            </>
                        )}
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
