import { Head } from '@inertiajs/react';
import { CarFront } from 'lucide-react';
import { CarsTable } from '@/components/cars/cars-table';
import { EmptyState } from '@/components/empty-state';
import Heading from '@/components/heading';
import { PaginationLinks } from '@/components/pagination-links';
import { SearchInput } from '@/components/search-input';
import { StatusTabs } from '@/components/status-tabs';
import { useQueryFilters } from '@/hooks/use-query-filters';
import admin from '@/routes/admin';
import type { Car, Option, Paginated } from '@/types';

type Filters = { status?: string; search?: string };

export default function AdminCarsIndex({
    cars,
    filters,
    statuses,
}: {
    cars: Paginated<Car>;
    filters: Filters;
    statuses: Option[];
}) {
    const { apply } = useQueryFilters(admin.cars.index(), filters);

    return (
        <>
            <Head title="Listings" />

            <div className="space-y-6 p-4 md:p-6">
                <Heading
                    title="Listings"
                    description="Review new cars and monitor live listings."
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
                        placeholder="Search make or model"
                    />
                </div>

                {cars.data.length > 0 ? (
                    <CarsTable
                        cars={cars.data}
                        showLessor
                        actionLabel="Review"
                        actionHref={(car) => admin.cars.show(car.slug)}
                    />
                ) : (
                    <EmptyState icon={CarFront} title="No listings found" />
                )}
                <PaginationLinks paginated={cars} />
            </div>
        </>
    );
}

AdminCarsIndex.layout = {
    breadcrumbs: [{ title: 'Listings', href: admin.cars.index() }],
};
