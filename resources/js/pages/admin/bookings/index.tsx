import { Head } from '@inertiajs/react';
import { CalendarX } from 'lucide-react';
import { BookingsTable } from '@/components/bookings/bookings-table';
import { EmptyState } from '@/components/empty-state';
import Heading from '@/components/heading';
import { PaginationLinks } from '@/components/pagination-links';
import { SearchInput } from '@/components/search-input';
import { StatusTabs } from '@/components/status-tabs';
import { useQueryFilters } from '@/hooks/use-query-filters';
import admin from '@/routes/admin';
import type { Booking, Option, Paginated } from '@/types';

type Filters = { status?: string; search?: string };

export default function AdminBookingsIndex({
    bookings,
    filters,
    statuses,
}: {
    bookings: Paginated<Booking>;
    filters: Filters;
    statuses: Option[];
}) {
    const { apply } = useQueryFilters(admin.bookings.index(), filters);

    return (
        <>
            <Head title="Bookings" />

            <div className="space-y-6 p-4 md:p-6">
                <Heading
                    title="Bookings"
                    description="Every booking across all lessors."
                />
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <StatusTabs
                        statuses={statuses}
                        value={filters.status}
                        onChange={(status) => apply({ status })}
                    />
                    <SearchInput
                        value={filters.search}
                        onSearch={(search) => apply({ search })}
                        placeholder="Reference, renter or lessor"
                    />
                </div>

                {bookings.data.length > 0 ? (
                    <BookingsTable bookings={bookings.data} showLessor />
                ) : (
                    <EmptyState icon={CalendarX} title="No bookings found" />
                )}
                <PaginationLinks paginated={bookings} />
            </div>
        </>
    );
}

AdminBookingsIndex.layout = {
    breadcrumbs: [{ title: 'Bookings', href: admin.bookings.index() }],
};
