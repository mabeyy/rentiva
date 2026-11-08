import { Head, Link } from '@inertiajs/react';
import { CalendarOff, ChevronRight } from 'lucide-react';
import CarController from '@/actions/App/Http/Controllers/Lessor/CarController';
import type { CarFormOptions } from '@/components/cars/car-form/car-form';
import { CarForm } from '@/components/cars/car-form/car-form';
import type { CarServiceEntry } from '@/components/cars/car-services-card';
import { CarServicesCard } from '@/components/cars/car-services-card';
import { ListingStatusPanel } from '@/components/cars/listing-status-panel';
import { PageHeader } from '@/components/lessor/page-header';
import lessor from '@/routes/lessor';
import type { Car } from '@/types';

export default function LessorCarsEdit({
    car,
    upcomingBlocksCount,
    services,
    ...options
}: CarFormOptions & {
    car: Car;
    services: CarServiceEntry[];
    /** Upcoming blocked stretches, managed under Bookings → Blocked. */
    upcomingBlocksCount: number;
}) {
    return (
        <>
            <Head title={`Edit ${car.name}`} />

            <div className="mx-auto w-full max-w-4xl space-y-6 p-4 md:p-8">
                <PageHeader
                    eyebrow="Edit listing"
                    title={car.name}
                    description="Update details, features and photos."
                />
                <ListingStatusPanel car={car} />
                <Link
                    href={lessor.bookings.blocked({
                        query: { car: car.slug },
                    })}
                    className="flex items-center gap-3 rounded-2xl border bg-background px-4 py-3 text-sm transition-colors hover:border-foreground/30"
                >
                    <CalendarOff className="size-4 text-muted-foreground" />
                    <span className="flex-1">
                        {upcomingBlocksCount > 0
                            ? `${upcomingBlocksCount} upcoming ${upcomingBlocksCount === 1 ? 'block' : 'blocks'}`
                            : 'No blocked dates'}
                        <span className="text-muted-foreground">
                            {' '}
                            · Days renters can't book, like maintenance
                        </span>
                    </span>
                    <span className="flex items-center gap-0.5 font-medium">
                        {upcomingBlocksCount > 0 ? 'Manage' : 'Block dates'}
                        <ChevronRight className="size-4" />
                    </span>
                </Link>
                <CarServicesCard carSlug={car.slug} services={services} />
                <CarForm
                    form={CarController.update.form(car.slug)}
                    car={car}
                    options={options}
                    submitLabel="Save changes"
                />
            </div>
        </>
    );
}

LessorCarsEdit.layout = {
    breadcrumbs: [{ title: 'My cars', href: lessor.cars.index() }],
};
