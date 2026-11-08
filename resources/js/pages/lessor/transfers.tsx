import { Head, Link } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import {
    Check,
    CircleCheck,
    Copy,
    History,
    Inbox,
    Mail,
    Maximize2,
    Phone,
} from 'lucide-react';
import BookingPaymentController from '@/actions/App/Http/Controllers/Lessor/BookingPaymentController';
import { BookingsTable } from '@/components/bookings/bookings-table';
import { TransferDecision } from '@/components/bookings/transfer-decision';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/lessor/page-header';
import { PaginationLinks } from '@/components/pagination-links';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { useClipboard } from '@/hooks/use-clipboard';
import { formatDateRange, formatPeso } from '@/lib/format';
import { cn } from '@/lib/utils';
import lessor from '@/routes/lessor';
import type { Booking, Paginated } from '@/types';

type Tab = 'to-check' | 'history';

/** One transfer waiting to be checked, with the reference front and centre. */
function TransferCard({ booking }: { booking: Booking }) {
    const [copiedText, copy] = useClipboard();
    const proofUrl = BookingPaymentController.proof.url(booking.reference);
    const reference = booking.payment_reference ?? '';
    const isCopied = copiedText === reference;

    return (
        <article className="grid overflow-hidden rounded-3xl border bg-background md:grid-cols-[minmax(0,17rem)_1fr]">
            <div className="relative bg-muted">
                {booking.has_payment_proof ? (
                    <Dialog>
                        <DialogTrigger asChild>
                            <button
                                type="button"
                                className="group relative block h-64 w-full md:h-full md:min-h-72"
                                aria-label="Enlarge the transfer screenshot"
                            >
                                <img
                                    src={proofUrl}
                                    alt={`Transfer screenshot from ${booking.renter_name}`}
                                    className="absolute inset-0 size-full object-contain p-3"
                                />
                                <span className="absolute right-3 bottom-3 flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium shadow-sm backdrop-blur transition-opacity md:opacity-0 md:group-hover:opacity-100">
                                    <Maximize2 className="size-3" /> Enlarge
                                </span>
                            </button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-2xl">
                            <DialogTitle>
                                Transfer from {booking.renter_name}
                            </DialogTitle>
                            <img
                                src={proofUrl}
                                alt={`Transfer screenshot from ${booking.renter_name}`}
                                className="max-h-[75vh] w-full rounded-2xl object-contain"
                            />
                        </DialogContent>
                    </Dialog>
                ) : (
                    <p className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                        No screenshot
                    </p>
                )}
            </div>

            <div className="flex flex-col gap-5 p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <p className="text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                            Amount due
                        </p>
                        <p className="font-display text-3xl font-extrabold tracking-tight tabular-nums">
                            {formatPeso(booking.transfer_amount)}
                        </p>
                    </div>
                    {booking.payment_submitted_at && (
                        <p className="text-xs text-muted-foreground">
                            Sent{' '}
                            {format(
                                parseISO(booking.payment_submitted_at),
                                'MMM d, h:mm a',
                            )}
                        </p>
                    )}
                </div>

                <div className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-brand/40 bg-brand/5 px-4 py-3">
                    <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">
                            Reference to look for
                        </p>
                        <p className="truncate font-mono text-lg font-semibold">
                            {reference}
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copy(reference)}
                    >
                        {isCopied ? <Check /> : <Copy />}
                        {isCopied ? 'Copied' : 'Copy'}
                    </Button>
                </div>

                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                    <dt className="text-muted-foreground">Renter</dt>
                    <dd className="font-medium">{booking.renter_name}</dd>
                    <dt className="text-muted-foreground">Booking</dt>
                    <dd>
                        <span className="font-mono text-xs">
                            {booking.reference}
                        </span>{' '}
                        · {booking.car?.name}
                    </dd>
                    <dt className="text-muted-foreground">Dates</dt>
                    <dd>
                        {formatDateRange(booking.start_date, booking.end_date)}
                    </dd>
                    <dt className="text-muted-foreground">Contact</dt>
                    <dd className="flex flex-wrap gap-x-3">
                        <a
                            href={`tel:${booking.renter_phone}`}
                            className="flex items-center gap-1 hover:underline"
                        >
                            <Phone className="size-3.5" />
                            {booking.renter_phone}
                        </a>
                        <a
                            href={`mailto:${booking.renter_email}`}
                            className="flex items-center gap-1 hover:underline"
                        >
                            <Mail className="size-3.5" />
                            {booking.renter_email}
                        </a>
                    </dd>
                </dl>

                <div className="mt-auto border-t border-dashed pt-4">
                    <TransferDecision booking={booking} />
                </div>
            </div>
        </article>
    );
}

export default function LessorTransfers({
    tab,
    counts,
    transfers,
}: {
    tab: Tab;
    counts: { toCheck: number; history: number };
    /** A list for the queue; paginated for the history. */
    transfers: Booking[] | Paginated<Booking>;
}) {
    const tabs: {
        key: Tab;
        label: string;
        count: number;
        icon: typeof Inbox;
    }[] = [
        {
            key: 'to-check',
            label: 'To check',
            count: counts.toCheck,
            icon: Inbox,
        },
        {
            key: 'history',
            label: 'History',
            count: counts.history,
            icon: History,
        },
    ];
    const rows = Array.isArray(transfers) ? transfers : transfers.data;

    return (
        <>
            <Head title="Transfers" />

            <div className="mx-auto w-full max-w-5xl space-y-6 p-4 md:p-8">
                <PageHeader
                    eyebrow="Bank transfers"
                    title="Transfers"
                    description="Open your banking app, find each reference, then mark it paid or ask the renter to send it again."
                    actions={
                        <nav
                            aria-label="Transfers view"
                            className="flex h-11 items-center gap-1 rounded-full border bg-background p-1"
                        >
                            {tabs.map(({ key, label, count, icon: Icon }) => (
                                <Link
                                    key={key}
                                    href={lessor.transfers({
                                        query:
                                            key === 'history'
                                                ? { tab: key }
                                                : {},
                                    })}
                                    aria-current={
                                        tab === key ? 'page' : undefined
                                    }
                                    className={cn(
                                        'flex h-full items-center gap-1.5 rounded-full px-4 text-sm font-medium transition-colors [&_svg]:size-4',
                                        tab === key
                                            ? 'bg-ink text-ink-foreground'
                                            : 'text-muted-foreground hover:text-foreground',
                                    )}
                                >
                                    <Icon /> {label}
                                    <span
                                        className={cn(
                                            'rounded-full px-1.5 text-xs tabular-nums',
                                            tab === key
                                                ? 'bg-white/15'
                                                : 'bg-muted',
                                            key === 'to-check' &&
                                                count > 0 &&
                                                tab !== key &&
                                                'bg-brand text-brand-foreground',
                                        )}
                                    >
                                        {count}
                                    </span>
                                </Link>
                            ))}
                        </nav>
                    }
                />

                {tab === 'to-check' ? (
                    rows.length > 0 ? (
                        <div className="space-y-4">
                            {rows.map((booking) => (
                                <TransferCard
                                    key={booking.id}
                                    booking={booking}
                                />
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon={CircleCheck}
                            title="All caught up"
                            description="When a renter sends a bank transfer, it shows up here for you to check."
                        />
                    )
                ) : rows.length > 0 ? (
                    <>
                        <BookingsTable showPayment bookings={rows} />
                        {!Array.isArray(transfers) && (
                            <PaginationLinks paginated={transfers} />
                        )}
                    </>
                ) : (
                    <EmptyState
                        icon={History}
                        title="No transfers yet"
                        description="Transfers you mark paid or reject are kept here."
                    />
                )}
            </div>
        </>
    );
}

LessorTransfers.layout = {
    breadcrumbs: [{ title: 'Transfers', href: lessor.transfers() }],
};
