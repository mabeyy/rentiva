import { SearchX } from 'lucide-react';
import { CarCard } from '@/components/cars/car-card';
import type { CarFilterValues } from '@/components/cars/car-filters';
import { EmptyState } from '@/components/empty-state';
import { OptionSelect } from '@/components/option-select';
import { PaginationLinks } from '@/components/pagination-links';
import { useQueryFilters } from '@/hooks/use-query-filters';
import type { Car, Paginated } from '@/types';
import type { RouteDefinition } from '@/wayfinder';

const sortOptions = [
    { value: 'newest', label: 'Newest' },
    { value: 'price_asc', label: 'Price: low to high' },
    { value: 'price_desc', label: 'Price: high to low' },
];

/**
 * Sortable, paginated grid of car cards for a filtered listing page.
 */
export function CarResults({
    title,
    route,
    cars,
    filters,
    carHref,
}: {
    title: string;
    route: RouteDefinition<'get'>;
    cars: Paginated<Car>;
    filters: CarFilterValues;
    carHref: (car: Car) => RouteDefinition<'get'>;
}) {
    const { apply } = useQueryFilters(route, filters);

    return (
        <section>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <h2 className="flex items-baseline gap-3 font-display text-3xl font-extrabold tracking-tight">
                    {title}
                    <span className="font-sans text-sm font-medium tracking-normal text-muted-foreground">
                        {cars.meta.total}{' '}
                        {cars.meta.total === 1 ? 'car' : 'cars'} available
                    </span>
                </h2>
                <div className="w-48">
                    <OptionSelect
                        options={sortOptions}
                        value={filters.sort ?? 'newest'}
                        onChange={(sort) => apply({ sort })}
                    />
                </div>
            </div>

            {cars.data.length > 0 ? (
                <div className="grid gap-x-5 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
                    {cars.data.map((car) => (
                        <CarCard key={car.id} car={car} href={carHref(car)} />
                    ))}
                </div>
            ) : (
                <EmptyState
                    icon={SearchX}
                    title="No cars match your search"
                    description="Try different dates or remove some filters."
                />
            )}

            <PaginationLinks paginated={cars} />
        </section>
    );
}
