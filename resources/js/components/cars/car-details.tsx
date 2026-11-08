import { usePage } from '@inertiajs/react';
import { Bike, CarFront, MapPin } from 'lucide-react';
import { BookingCard } from '@/components/bookings/booking-card';
import { CarDescription } from '@/components/cars/car-description';
import { CarFeatureList } from '@/components/cars/car-feature-list';
import { CarGallery } from '@/components/cars/car-gallery';
import { CarSpecList } from '@/components/cars/car-spec-list';
import { toDateRange } from '@/components/date-range-picker';
import { Separator } from '@/components/ui/separator';
import { isTwoWheeler } from '@/lib/vehicle';
import type { BookedRange, Car } from '@/types';

/**
 * Car photos, specs and the booking card for a storefront car page.
 */
export function CarDetails({
    car,
    bookedRanges,
}: {
    car: Car;
    bookedRanges: BookedRange[];
}) {
    const query = new URLSearchParams(usePage().url.split('?')[1]);
    const twoWheeler = isTwoWheeler(car.body_type.value);
    const VehicleIcon = twoWheeler ? Bike : CarFront;

    return (
        <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
            <div className="min-w-0 space-y-8">
                <CarGallery images={car.images ?? []} alt={car.name} />

                <div>
                    <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 rounded-md bg-ink px-2 py-1 text-[10px] leading-none font-bold tracking-[0.14em] text-ink-foreground uppercase">
                            <VehicleIcon
                                aria-hidden
                                className="size-3 text-brand"
                            />
                            {car.body_type.label}
                        </span>
                    </div>
                    <h1 className="mt-4">
                        <span className="block text-sm font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                            {car.make}
                        </span>
                        <span className="sr-only"> </span>
                        <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-display text-4xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl">
                            {car.model}
                            <span className="rounded-lg border px-2.5 py-1 font-sans text-base leading-none font-semibold tracking-normal text-muted-foreground sm:text-lg">
                                {car.year}
                            </span>
                        </span>
                    </h1>
                    <div className="mt-4 flex flex-wrap gap-2 text-sm">
                        <span className="flex items-center gap-1.5 rounded-full border px-3 py-1.5">
                            <MapPin className="size-4 text-brand" />
                            {car.pickup_location
                                ? `${car.pickup_location.address}, ${car.pickup_location.city}`
                                : car.location}
                        </span>
                    </div>
                </div>

                {car.description && (
                    <CarDescription description={car.description} />
                )}

                <Separator />

                <section>
                    <h2 className="mb-4 font-display text-2xl font-bold tracking-tight">
                        {twoWheeler
                            ? "What you're riding"
                            : "What you're driving"}
                    </h2>
                    <CarSpecList car={car} />
                </section>

                {car.features && car.features.length > 0 && (
                    <section>
                        <h2 className="mb-4 font-display text-2xl font-bold tracking-tight">
                            Features
                        </h2>
                        <CarFeatureList features={car.features} />
                    </section>
                )}
            </div>

            <div className="lg:sticky lg:top-24 lg:self-start">
                <BookingCard
                    car={car}
                    bookedRanges={bookedRanges}
                    initialRange={toDateRange(
                        query.get('start_date'),
                        query.get('end_date'),
                    )}
                />
            </div>
        </div>
    );
}
