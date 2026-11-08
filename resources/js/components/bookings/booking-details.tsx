import { Head, Link, router } from '@inertiajs/react';
import { CalendarDays, Mail, MapPin, Phone, UserRound } from 'lucide-react';
import type { TransferDetails } from '@/components/bookings/booking-payment-card';
import { BookingPaymentCard } from '@/components/bookings/booking-payment-card';
import { BookingSummary } from '@/components/bookings/booking-summary';
import {
    RenterChangeRequest,
    RenterRefundNotice,
} from '@/components/bookings/renter-change-request';
import { quoteFromBooking } from '@/lib/booking-quote';
import type { TripReview } from '@/components/bookings/trip-review';
import { TripReviewCard } from '@/components/bookings/trip-review';
import { StatusBadge } from '@/components/status-badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateRange } from '@/lib/format';
import { totalLabelFor } from '@/lib/payment';
import type { Booking } from '@/types';
import type { RouteDefinition } from '@/wayfinder';

export type BookingHost = { name: string; email: string; phone: string | null };

const statusMessages: Record<string, string> = {
    pending:
        'Waiting for the owner to confirm. We will email you as soon as they respond.',
    confirmed:
        'Confirmed! Contact the owner below to arrange pickup. Payment is made at pickup.',
    declined: 'The owner could not accept this request.',
    cancelled: 'This booking was cancelled.',
    completed: 'Trip completed. Thanks for renting with us!',
};

/**
 * A guest's booking: status, car, price, contact and cancellation.
 * Shared by the plain and storefront-branded booking pages.
 */
export function BookingDetails({
    booking,
    host,
    cancelUrl,
    cancellationNote,
    payment,
    review,
    reviewUrl,
    carHref,
    changeRequestUrl = null,
}: {
    /** Signed URL for asking the owner to move the dates. */
    changeRequestUrl?: string | null;
    booking: Booking;
    host: BookingHost | null;
    cancelUrl: string | null;
    /** Why an active booking has no Cancel button (the owner's policy). */
    cancellationNote?: string | null;
    /** Bank transfer details, for bank-transfer bookings. */
    payment: TransferDetails | null;
    review: TripReview | null;
    /** Signed URL for rating the trip; set only for an unrated completed booking. */
    reviewUrl: string | null;
    /** The car's page on the owner's storefront, when there is one. */
    carHref?: RouteDefinition<'get'>;
}) {
    const car = booking.car!;

    return (
        <>
            <Head title={`Booking ${booking.reference}`} />

            <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase">
                            <span
                                aria-hidden
                                className="h-0.5 w-8 rounded-full bg-brand"
                            />
                            Booking reference
                        </p>
                        <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight">
                            {booking.reference}
                        </h1>
                    </div>
                    <StatusBadge status={booking.status} />
                </div>

                <Alert>
                    <AlertTitle>{booking.status.label}</AlertTitle>
                    <AlertDescription>
                        {statusMessages[booking.status.value]}
                        {booking.decline_reason &&
                            ` Reason: ${booking.decline_reason}`}
                    </AlertDescription>
                </Alert>

                <Card>
                    <CardContent className="flex flex-col gap-4 sm:flex-row">
                        {car.cover_image && (
                            <img
                                src={car.cover_image.url}
                                alt={car.name}
                                className="h-32 w-full rounded-lg object-cover sm:w-48"
                            />
                        )}
                        <div className="space-y-1">
                            {carHref ? (
                                <Link
                                    href={carHref}
                                    className="text-lg font-semibold hover:underline"
                                >
                                    {car.name}
                                </Link>
                            ) : (
                                <p className="text-lg font-semibold">
                                    {car.name}
                                </p>
                            )}
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="size-4" /> {car.location}
                            </p>
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CalendarDays className="size-4" />{' '}
                                {formatDateRange(
                                    booking.start_date,
                                    booking.end_date,
                                )}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-6 sm:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Price</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <BookingSummary
                                quote={quoteFromBooking(booking)}
                                totalLabel={totalLabelFor(
                                    booking.payment_method.value,
                                )}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                {host ? 'Your host' : 'Driver'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <p className="flex items-center gap-2">
                                <UserRound className="size-4 text-muted-foreground" />{' '}
                                {host?.name ?? booking.renter_name}
                            </p>
                            <p className="flex items-center gap-2">
                                <Mail className="size-4 text-muted-foreground" />{' '}
                                {host?.email ?? booking.renter_email}
                            </p>
                            <p className="flex items-center gap-2">
                                <Phone className="size-4 text-muted-foreground" />{' '}
                                {host
                                    ? (host.phone ?? '—')
                                    : booking.renter_phone}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <BookingPaymentCard booking={booking} transfer={payment} />

                <RenterRefundNotice booking={booking} />
                <RenterChangeRequest
                    booking={booking}
                    changeRequestUrl={changeRequestUrl}
                />

                <TripReviewCard review={review} reviewUrl={reviewUrl} />

                {cancellationNote && (
                    <p className="rounded-2xl bg-muted/50 p-4 text-sm text-muted-foreground">
                        {cancellationNote}
                    </p>
                )}

                {cancelUrl && (
                    <ConfirmDialog
                        trigger={
                            <Button
                                variant="outline"
                                className="w-full rounded-full sm:w-auto"
                            >
                                Cancel booking
                            </Button>
                        }
                        title="Cancel this booking?"
                        description="The owner will be notified and the dates released. This cannot be undone."
                        cancelLabel="Keep booking"
                        confirmLabel="Cancel booking"
                        onConfirm={() =>
                            router.delete(cancelUrl, { preserveScroll: true })
                        }
                    />
                )}
            </div>
        </>
    );
}
