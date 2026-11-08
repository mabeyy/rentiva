import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { BookingPaymentReview } from '@/components/bookings/booking-payment-review';
import { StatusBadge } from '@/components/status-badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatDateRange, formatPeso } from '@/lib/format';
import type { Booking } from '@/types';

/**
 * Bookings list shared by the lessor and admin areas.
 */
export function BookingsTable({
    bookings,
    showLessor = false,
    showPayment = false,
    actions,
    bookingHref,
}: {
    bookings: Booking[];
    showLessor?: boolean;
    /** Show transfer status and the owner's "Check payment" control. */
    showPayment?: boolean;
    actions?: (booking: Booking) => ReactNode;
    /** Makes the reference a link, e.g. to the owner's booking page. */
    bookingHref?: (booking: Booking) => string;
}) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Car</TableHead>
                    {showLessor && <TableHead>Lessor</TableHead>}
                    <TableHead>Renter</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    {actions && (
                        <TableHead className="text-right">Actions</TableHead>
                    )}
                </TableRow>
            </TableHeader>
            <TableBody>
                {bookings.map((booking) => (
                    <TableRow key={booking.id}>
                        <TableCell className="font-mono text-xs">
                            {bookingHref ? (
                                <Link
                                    href={bookingHref(booking)}
                                    className="font-medium text-brand hover:underline"
                                >
                                    {booking.reference}
                                </Link>
                            ) : (
                                booking.reference
                            )}
                        </TableCell>
                        <TableCell className="font-medium">
                            {booking.car?.name}
                        </TableCell>
                        {showLessor && (
                            <TableCell>{booking.car?.host_name}</TableCell>
                        )}
                        <TableCell>
                            <div>{booking.renter_name}</div>
                            <div className="text-xs text-muted-foreground">
                                {booking.renter_phone}
                                {booking.renter_email &&
                                    ` · ${booking.renter_email}`}
                            </div>
                            {booking.notes && (
                                <div className="mt-1 max-w-xs text-xs whitespace-normal italic">
                                    “{booking.notes}”
                                </div>
                            )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                            {formatDateRange(
                                booking.start_date,
                                booking.end_date,
                            )}
                            <div className="text-xs text-muted-foreground">
                                {booking.days}{' '}
                                {booking.days === 1 ? 'day' : 'days'}
                            </div>
                        </TableCell>
                        <TableCell className="text-right">
                            {formatPeso(booking.total)}
                        </TableCell>
                        <TableCell>
                            <div className="space-y-1.5">
                                <StatusBadge status={booking.status} />
                                {showPayment && (
                                    <BookingPaymentReview booking={booking} />
                                )}
                            </div>
                        </TableCell>
                        {actions && <TableCell>{actions(booking)}</TableCell>}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
