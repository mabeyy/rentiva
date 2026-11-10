import { Head } from '@inertiajs/react';
import CarController from '@/actions/App/Http/Controllers/Lessor/CarController';
import type { CarFormOptions } from '@/components/cars/car-form/car-form';
import { CarForm, carFormSections } from '@/components/cars/car-form/car-form';
import type { CarServiceEntry } from '@/components/cars/car-services-card';
import { CarServicesCard } from '@/components/cars/car-services-card';
import { ListingStatusPanel } from '@/components/cars/listing-status-panel';
import { PageHeader } from '@/components/lessor/page-header';
import { SectionNav } from '@/components/lessor/section-nav';
import lessor from '@/routes/lessor';
import type { Car } from '@/types';

/**
 * Editing a listing: the form on the left; on the right the car at a glance
 * (photo, status, next action, blocked dates) and a menu that jumps to each
 * section.
 */
export default function LessorCarsEdit({
    car,
    upcomingBlocksCount,
    hasBookings,
    services,
    ...options
}: CarFormOptions & {
    car: Car;
    services: CarServiceEntry[];
    /** Upcoming blocked stretches, managed under Bookings → Blocked. */
    upcomingBlocksCount: number;
    /** Booked cars can't be deleted, only switched off. */
    hasBookings: boolean;
}) {
    return (
        <>
            <Head title={`Edit ${car.name}`} />

            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8">
                <PageHeader
                    title={car.name}
                    description="Update the details renters see, your prices and photos."
                />

                <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="order-2 space-y-6 lg:order-1">
                        <CarForm
                            form={CarController.update.form(car.slug)}
                            car={car}
                            options={options}
                            submitLabel="Save changes"
                            numbered={false}
                        />
                    </div>

                    <aside className="order-1 space-y-4 lg:order-2 lg:self-stretch">
                        <ListingStatusPanel
                            car={car}
                            upcomingBlocksCount={upcomingBlocksCount}
                            hasBookings={hasBookings}
                        />
                        <CarServicesCard
                            carSlug={car.slug}
                            services={services}
                        />
                        <SectionNav sections={carFormSections} />
                    </aside>
                </div>
            </div>
        </>
    );
}

LessorCarsEdit.layout = {
    breadcrumbs: [{ title: 'My cars', href: lessor.cars.index() }],
};
