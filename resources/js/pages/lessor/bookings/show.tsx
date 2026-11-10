import { Head, Link, router, usePage } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import {
    AlertTriangle,
    ArrowLeft,
    CalendarDays,
    CarFront,
    CheckCircle2,
    FileSignature,
    IdCard,
    Mail,
    MapPin,
    Phone,
    Receipt,
    Truck,
    UserRound,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { ChangeableCar } from '@/components/bookings/booking-change-dialog';
import { BookingChangeDialog } from '@/components/bookings/booking-change-dialog';
import { BookingChargesCard } from '@/components/bookings/booking-charges-card';
import { BookingDepositCard } from '@/components/bookings/booking-deposit-card';
import { InfoTip } from '@/components/info-tip';
import { BookingInspectionsCard } from '@/components/bookings/booking-inspections-card';
import {
    BookingRefundCard,
    OwnerChangeRequest,
} from '@/components/bookings/owner-change-request';
import { BookingPaymentReview } from '@/components/bookings/booking-payment-review';
import { BookingStatusActions } from '@/components/bookings/booking-status-actions';
import { BookingSummary } from '@/components/bookings/booking-summary';
import { ReviewReplyForm } from '@/components/bookings/review-reply-form';
import { Stars } from '@/components/bookings/trip-review';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import type { Season } from '@/lib/booking-quote';
import { quoteFromBooking } from '@/lib/booking-quote';
import { formatDateRange, formatPeso } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { ActivityEvent } from '@/pages/lessor/activity';
import { actionMeta } from '@/pages/lessor/activity';
import lessor from '@/routes/lessor';
import type { Booking } from '@/types';
import { ImageLightbox } from '@/components/image-lightbox';

type BookingReview = {
    id: number;
    rating: number;
    comment: string | null;
    owner_reply: string | null;
    created_at: string;
};

type RenterSummary = {
    key: string;
    bookings_count: number;
    flag: string | null;
};

function Card({
    title,
    info,
    action,
    children,
    className,
}: {
    title: string;
    /** A short explanation shown from an "i" beside the title. */
    info?: string;
    action?: ReactNode;
    children: ReactNode;
    className?: string;
}) {
    return (
        <section
            className={cn('rounded-3xl border bg-background p-5', className)}
        >
            <div className="mb-4 flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-1 text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                    {title}
                    {info && <InfoTip>{info}</InfoTip>}
                </h2>
                {action}
            </div>
            {children}
        </section>
    );
}

function Detail({
    icon: Icon,
    children,
}: {
    icon: typeof Phone;
    children: ReactNode;
}) {
    return (
        <p className="flex items-start gap-2.5 text-sm">
            <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 break-words">{children}</span>
        </p>
    );
}

export default function LessorBookingShow({
    booking,
    events,
    review,
    renter,
    cars,
    chargeLabels,
    seasons,
}: {
    seasons: Season[];
    booking: Booking;
    events: ActivityEvent[];
    review: BookingReview | null;
    renter: RenterSummary | null;
    cars: ChangeableCar[];
    chargeLabels: string[];
}) {
    const { workspace } = usePage<{
        workspace?: { permissions: string[] } | null;
    }>().props;
    // Refunds, charges and deposits are for the owner and payments staff.
    const canHandleMoney =
        !workspace || workspace.permissions.includes('payments');
    const car = booking.car;
    const canAct = booking.next_statuses.length > 0;
    const isActive = ['pending', 'confirmed'].includes(booking.status.value);
    const isUnderway = ['confirmed', 'completed'].includes(
        booking.status.value,
    );

    return (
        <>
            <Head title={`${booking.reference} · ${booking.renter_name}`} />

            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8">
                <Link
                    href={lessor.bookings.index()}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="size-4" /> Bookings
                </Link>

                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                        <p className="font-mono text-xs text-muted-foreground">
                            {booking.reference}
                            {booking.source.value !== 'online' &&
                                ` · Added by you (${booking.source.label})`}
                        </p>
                        <h1 className="mt-1 flex flex-wrap items-center gap-3 font-display text-3xl font-bold tracking-tight">
                            {booking.renter_name}
                            <StatusBadge status={booking.status} />
                        </h1>
                        <p className="mt-1 text-muted-foreground">
                            {car?.name} ·{' '}
                            {formatDateRange(
                                booking.start_date,
                                booking.end_date,
                            )}{' '}
                            · {booking.days}{' '}
                            {booking.days === 1 ? 'day' : 'days'}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            variant="outline"
                            className="rounded-full"
                            asChild
                        >
                            <a
                                href={
                                    lessor.bookings.receipt(booking.reference)
                                        .url
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Receipt /> Receipt
                            </a>
                        </Button>
                        <Button
                            variant="outline"
                            className="rounded-full"
                            asChild
                        >
                            <a
                                href={
                                    lessor.bookings.agreement(booking.reference)
                                        .url
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <FileSignature /> Agreement
                            </a>
                        </Button>
                        {isActive && (
                            <BookingChangeDialog
                                booking={booking}
                                cars={cars}
                                seasons={seasons}
                            />
                        )}
                        {canAct && <BookingStatusActions booking={booking} />}
                    </div>
                </div>

                <OwnerChangeRequest booking={booking} />

                {booking.needs_refund && (
                    <p className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
                        <span className="font-semibold">Refund owed.</span> This
                        booking was paid and then{' '}
                        {booking.status.label.toLowerCase()}. Record the refund
                        on the right.
                    </p>
                )}

                {renter?.flag && (
                    <div className="flex gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                        <p>
                            <span className="font-semibold">
                                You flagged this renter:
                            </span>{' '}
                            {renter.flag}
                        </p>
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        <Card title="Trip">
                            <div className="flex gap-4">
                                <div className="size-20 shrink-0 overflow-hidden rounded-2xl bg-muted">
                                    {car?.cover_image ? (
                                        <img
                                            src={car.cover_image.url}
                                            alt=""
                                            className="size-full object-cover"
                                        />
                                    ) : (
                                        <span className="flex size-full items-center justify-center">
                                            <CarFront className="size-6 text-muted-foreground/40" />
                                        </span>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1 space-y-2">
                                    <p className="font-semibold">
                                        {car && (
                                            <Link
                                                href={lessor.cars.edit(
                                                    car.slug,
                                                )}
                                                className="hover:underline"
                                            >
                                                {car.name}
                                            </Link>
                                        )}
                                    </p>
                                    <Detail icon={CalendarDays}>
                                        Pickup{' '}
                                        {format(
                                            parseISO(booking.start_date),
                                            'EEE, MMM d',
                                        )}{' '}
                                        · Return{' '}
                                        {format(
                                            parseISO(booking.end_date),
                                            'EEE, MMM d, yyyy',
                                        )}
                                    </Detail>
                                    {booking.delivery_address ? (
                                        <Detail icon={Truck}>
                                            Deliver to{' '}
                                            {booking.delivery_address}
                                        </Detail>
                                    ) : (
                                        car?.pickup_location && (
                                            <Detail icon={MapPin}>
                                                {car.pickup_location.address},{' '}
                                                {car.pickup_location.city}
                                            </Detail>
                                        )
                                    )}
                                    {booking.with_driver && (
                                        <Detail icon={UserRound}>
                                            With your driver
                                        </Detail>
                                    )}
                                </div>
                            </div>
                            {booking.notes && (
                                <p className="mt-4 rounded-2xl bg-muted/50 p-3 text-sm whitespace-pre-line">
                                    <span className="font-medium">Note: </span>
                                    {booking.notes}
                                </p>
                            )}
                            {booking.decline_reason && (
                                <p className="mt-4 rounded-2xl bg-muted/50 p-3 text-sm">
                                    <span className="font-medium">
                                        Reason given:{' '}
                                    </span>
                                    {booking.decline_reason}
                                </p>
                            )}
                        </Card>

                        <div className="grid gap-6 sm:grid-cols-2">
                            <Card title="Price">
                                <BookingSummary
                                    quote={quoteFromBooking(booking)}
                                />
                            </Card>
                            <Card title="Payment">
                                <div className="space-y-3 text-sm">
                                    <p className="font-medium">
                                        {booking.payment_method.label}
                                    </p>
                                    {booking.payment_method.value ===
                                    'bank_transfer' ? (
                                        <BookingPaymentReview
                                            booking={booking}
                                        />
                                    ) : (
                                        <StatusBadge
                                            status={booking.payment_status}
                                        />
                                    )}
                                    {booking.payment_reference && (
                                        <p className="text-muted-foreground">
                                            Reference{' '}
                                            <span className="font-mono text-foreground">
                                                {booking.payment_reference}
                                            </span>
                                        </p>
                                    )}
                                    {booking.down_payment > 0 && (
                                        <p className="text-muted-foreground">
                                            Down payment{' '}
                                            <InfoTip>
                                                The part the renter pays by bank
                                                transfer after you confirm. The
                                                rest is paid at pickup.
                                            </InfoTip>{' '}
                                            <span className="font-medium text-foreground tabular-nums">
                                                {formatPeso(
                                                    booking.down_payment,
                                                )}
                                            </span>
                                        </p>
                                    )}
                                    {booking.balance_due > 0 &&
                                        booking.balance_due < booking.total && (
                                            <p className="text-muted-foreground">
                                                Balance at pickup{' '}
                                                <InfoTip>
                                                    What's left to collect when
                                                    the renter picks up the car,
                                                    after what they already
                                                    paid.
                                                </InfoTip>{' '}
                                                <span className="font-medium text-foreground tabular-nums">
                                                    {formatPeso(
                                                        booking.balance_due,
                                                    )}
                                                </span>
                                            </p>
                                        )}
                                    {booking.overpaid > 0 && (
                                        <p className="font-medium text-amber-700 dark:text-amber-400">
                                            The renter paid{' '}
                                            {formatPeso(booking.overpaid)} more
                                            than the new total. Refund the
                                            difference.
                                        </p>
                                    )}
                                    {booking.paid_at && (
                                        <p className="text-muted-foreground">
                                            Paid{' '}
                                            {format(
                                                parseISO(booking.paid_at),
                                                'MMM d, yyyy',
                                            )}
                                        </p>
                                    )}
                                </div>
                            </Card>
                        </div>

                        {isUnderway && (
                            <Card title="Pickup and return">
                                <BookingInspectionsCard booking={booking} />
                            </Card>
                        )}

                        {review && (
                            <Card title="Review">
                                <Stars rating={review.rating} />
                                {review.comment && (
                                    <p className="mt-3 whitespace-pre-line">
                                        “{review.comment}”
                                    </p>
                                )}
                                <div className="mt-4">
                                    <ReviewReplyForm
                                        reviewId={review.id}
                                        reply={review.owner_reply}
                                    />
                                </div>
                            </Card>
                        )}
                    </div>

                    <div className="space-y-6">
                        <Card
                            title="Renter"
                            action={
                                renter && (
                                    <Link
                                        href={lessor.renters.show(renter.key)}
                                        className="text-xs font-medium text-brand hover:underline"
                                    >
                                        {renter.bookings_count === 1
                                            ? 'First booking'
                                            : `${renter.bookings_count} bookings with you`}
                                    </Link>
                                )
                            }
                        >
                            <div className="space-y-2.5">
                                <Detail icon={Phone}>
                                    <a
                                        href={`tel:${booking.renter_phone}`}
                                        className="hover:underline"
                                    >
                                        {booking.renter_phone}
                                    </a>
                                </Detail>
                                {booking.renter_email && (
                                    <Detail icon={Mail}>
                                        <a
                                            href={`mailto:${booking.renter_email}`}
                                            className="hover:underline"
                                        >
                                            {booking.renter_email}
                                        </a>
                                    </Detail>
                                )}
                                <Detail icon={IdCard}>
                                    {booking.renter_license_number ?? (
                                        <span className="text-muted-foreground">
                                            No license number yet
                                        </span>
                                    )}
                                </Detail>
                            </div>

                            <div className="mt-4 border-t border-dashed pt-4">
                                {booking.has_license_photo ? (
                                    <ImageLightbox
                                        src={
                                            lessor.bookings.license.show(
                                                booking.reference,
                                            ).url
                                        }
                                        alt={`${booking.renter_name}'s driver's license`}
                                        label="Enlarge license photo"
                                        className="block w-full overflow-hidden rounded-2xl border"
                                    >
                                        <img
                                            src={
                                                lessor.bookings.license.show(
                                                    booking.reference,
                                                ).url
                                            }
                                            alt={`${booking.renter_name}'s driver's license`}
                                            className="aspect-[3/2] w-full object-cover"
                                        />
                                    </ImageLightbox>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        No license photo uploaded.
                                    </p>
                                )}
                                {booking.license_checked_at ? (
                                    <p className="mt-3 flex items-center justify-between gap-2 text-sm">
                                        <span className="flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400">
                                            <CheckCircle2 className="size-4" />
                                            License checked
                                        </span>
                                        <button
                                            type="button"
                                            className="text-xs text-muted-foreground hover:text-foreground"
                                            onClick={() =>
                                                router.put(
                                                    lessor.bookings.license.update(
                                                        booking.reference,
                                                    ).url,
                                                    { checked: false },
                                                    { preserveScroll: true },
                                                )
                                            }
                                        >
                                            Undo
                                        </button>
                                    </p>
                                ) : (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-3 w-full rounded-full"
                                        onClick={() =>
                                            router.put(
                                                lessor.bookings.license.update(
                                                    booking.reference,
                                                ).url,
                                                { checked: true },
                                                { preserveScroll: true },
                                            )
                                        }
                                    >
                                        <CheckCircle2 /> Mark license as checked
                                    </Button>
                                )}
                            </div>
                        </Card>

                        {canHandleMoney &&
                            booking.amount_paid > 0 &&
                            ['cancelled', 'declined'].includes(
                                booking.status.value,
                            ) && (
                                <Card title="Refund">
                                    <BookingRefundCard booking={booking} />
                                </Card>
                            )}

                        {canHandleMoney && isUnderway && (
                            <Card title="Extra charges">
                                <BookingChargesCard
                                    booking={booking}
                                    suggestedLabels={chargeLabels}
                                />
                            </Card>
                        )}

                        {canHandleMoney &&
                            isUnderway &&
                            booking.security_deposit > 0 && (
                                <Card
                                    title="Security deposit"
                                    info="Money you hold at pickup in case of damage or late return. It's not part of the rental total; record what you give back when the car returns."
                                >
                                    <BookingDepositCard booking={booking} />
                                </Card>
                            )}

                        <Card title="History">
                            <ol className="relative space-y-4 border-l pl-5">
                                {events.map((event) => {
                                    const meta = actionMeta[event.action];
                                    const Icon = meta?.icon ?? CalendarDays;

                                    return (
                                        <li key={event.id} className="relative">
                                            <span
                                                className={cn(
                                                    'absolute top-0 -left-[1.95rem] flex size-6 items-center justify-center rounded-full ring-4 ring-background',
                                                    meta?.tone ??
                                                        'bg-muted text-muted-foreground',
                                                )}
                                            >
                                                <Icon className="size-3" />
                                            </span>
                                            <p className="text-sm font-medium">
                                                {meta?.label ?? event.action}
                                            </p>
                                            {event.description && (
                                                <p className="text-xs text-muted-foreground">
                                                    {event.description}
                                                </p>
                                            )}
                                            <p className="text-xs text-muted-foreground">
                                                {event.actor_type === 'owner'
                                                    ? 'You'
                                                    : event.actor_name}
                                                {event.created_at &&
                                                    ` · ${format(parseISO(event.created_at), 'MMM d, h:mm a')}`}
                                            </p>
                                        </li>
                                    );
                                })}
                            </ol>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

LessorBookingShow.layout = {
    breadcrumbs: [{ title: 'Bookings', href: lessor.bookings.calendar() }],
};
