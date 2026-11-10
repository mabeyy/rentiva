import { Head, usePage } from '@inertiajs/react';
import { Download, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BookingStatusActions } from '@/components/bookings/booking-status-actions';
import { BookingsTable } from '@/components/bookings/bookings-table';
import { EmptyState } from '@/components/empty-state';
import { BookingsViewTabs } from '@/components/lessor/bookings-view-tabs';
import { PageHeader } from '@/components/lessor/page-header';
import { PaginationLinks } from '@/components/pagination-links';
import { StatusTabs } from '@/components/status-tabs';
import { useQueryFilters } from '@/hooks/use-query-filters';
import lessor from '@/routes/lessor';
import type { Booking, Option, Paginated } from '@/types';

export default function LessorBookingsIndex({
    bookings,
    status,
    statuses,
}: {
    bookings: Paginated<Booking>;
    status: string | null;
    statuses: Option[];
}) {
    const { apply } = useQueryFilters(lessor.bookings.index(), { status });

    const { workspace } = usePage<{
        workspace?: { permissions: string[] } | null;
    }>().props;
    // The export includes money, so it's for the owner and payments staff.
    const canExport = !workspace || workspace.permissions.includes('payments');

    return (
        <>
            <Head title="Bookings" />

            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8">
                <PageHeader
                    title="Bookings"
                    description="Confirm requests quickly: ones you don't answer within 48 hours expire."
                    actions={<BookingsViewTabs active="list" />}
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <StatusTabs
                        statuses={statuses}
                        value={status}
                        onChange={(value) => apply({ status: value })}
                    />
                    {canExport && (
                        <Button
                            variant="outline"
                            className="rounded-full"
                            asChild
                        >
                            <a
                                href={
                                    lessor.bookings.export({
                                        query: status ? { status } : {},
                                    }).url
                                }
                            >
                                <Download /> Export CSV
                            </a>
                        </Button>
                    )}
                </div>

                {bookings.data.length > 0 ? (
                    <BookingsTable
                        showPayment
                        bookings={bookings.data}
                        bookingHref={(booking) =>
                            lessor.bookings.show(booking.reference).url
                        }
                        actions={(booking) => (
                            <BookingStatusActions booking={booking} compact />
                        )}
                    />
                ) : (
                    <EmptyState
                        icon={Inbox}
                        title="No bookings here yet"
                        description="Share your booking page link to start getting requests."
                    />
                )}
                <PaginationLinks paginated={bookings} />
            </div>
        </>
    );
}

LessorBookingsIndex.layout = {
    breadcrumbs: [
        { title: 'Bookings', href: lessor.bookings.calendar() },
        { title: 'List', href: lessor.bookings.index() },
    ],
};
