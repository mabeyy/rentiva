import { format, parseISO } from 'date-fns';
import { Landmark } from 'lucide-react';
import { useState } from 'react';
import BookingPaymentController from '@/actions/App/Http/Controllers/Lessor/BookingPaymentController';
import { TransferDecision } from '@/components/bookings/transfer-decision';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { formatPeso } from '@/lib/format';
import type { Booking } from '@/types';

/**
 * Payment state of a bank-transfer booking for its owner, with a "Check
 * payment" dialog to view the renter's screenshot and accept or reject it.
 * Renders nothing for pay-at-pickup bookings.
 */
export function BookingPaymentReview({ booking }: { booking: Booking }) {
    const [isOpen, setIsOpen] = useState(false);

    if (booking.payment_method.value !== 'bank_transfer') {
        return null;
    }

    const isToCheck = booking.payment_status.value === 'submitted';

    return (
        <>
            <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Landmark className="size-3.5" /> Transfer
                </span>
                <StatusBadge status={booking.payment_status} />
                {booking.payment_due_at &&
                    ['unpaid', 'rejected'].includes(
                        booking.payment_status.value,
                    ) &&
                    booking.status.value === 'confirmed' && (
                        <span className="text-xs text-muted-foreground">
                            due{' '}
                            {format(
                                parseISO(booking.payment_due_at),
                                'MMM d, h:mm a',
                            )}
                        </span>
                    )}
                {isToCheck && (
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-7 rounded-full border-brand/40 text-brand"
                        onClick={() => setIsOpen(true)}
                    >
                        Check payment
                    </Button>
                )}
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            Check payment for {booking.reference}
                        </DialogTitle>
                        <DialogDescription>
                            Make sure {formatPeso(booking.transfer_amount)}{' '}
                            reached your account before marking it paid.
                        </DialogDescription>
                    </DialogHeader>

                    <dl className="grid grid-cols-2 gap-3 rounded-2xl bg-muted/40 p-4 text-sm">
                        <div>
                            <dt className="text-xs text-muted-foreground">
                                Renter
                            </dt>
                            <dd className="font-medium">
                                {booking.renter_name}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs text-muted-foreground">
                                Amount due
                            </dt>
                            <dd className="font-display font-bold tabular-nums">
                                {formatPeso(booking.transfer_amount)}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs text-muted-foreground">
                                Reference
                            </dt>
                            <dd className="font-medium break-all">
                                {booking.payment_reference}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs text-muted-foreground">
                                Sent
                            </dt>
                            <dd className="font-medium">
                                {booking.payment_submitted_at &&
                                    format(
                                        parseISO(booking.payment_submitted_at),
                                        'MMM d, h:mm a',
                                    )}
                            </dd>
                        </div>
                    </dl>

                    {booking.has_payment_proof && (
                        <a
                            href={BookingPaymentController.proof.url(
                                booking.reference,
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Open full size"
                        >
                            <img
                                src={BookingPaymentController.proof.url(
                                    booking.reference,
                                )}
                                alt="Renter's transfer screenshot"
                                className="max-h-80 w-full rounded-2xl border bg-muted object-contain"
                            />
                        </a>
                    )}

                    <TransferDecision
                        booking={booking}
                        onDone={() => setIsOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
}
