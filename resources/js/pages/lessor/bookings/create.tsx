import { Head, router } from '@inertiajs/react';
import type { ManualBookingOptions } from '@/components/bookings/manual-booking-form';
import { ManualBookingForm } from '@/components/bookings/manual-booking-form';
import { PageHeader } from '@/components/lessor/page-header';
import lessor from '@/routes/lessor';

/**
 * The add-booking form on its own page, for direct links. The bookings pages
 * open the same form in a modal.
 */
export default function LessorBookingCreate({
    initialCar,
    ...options
}: ManualBookingOptions & { initialCar: string | null }) {
    return (
        <>
            <Head title="Add a booking" />

            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8">
                <PageHeader
                    title="Add a booking"
                    description="For bookings you took by phone, chat or in person. It's confirmed straight away and the dates are taken off your booking page."
                />
                <div className="rounded-3xl border bg-background p-5 sm:p-6">
                    <ManualBookingForm
                        options={options}
                        initialCar={initialCar}
                        onCancel={() =>
                            router.visit(lessor.bookings.calendar())
                        }
                    />
                </div>
            </div>
        </>
    );
}

LessorBookingCreate.layout = {
    breadcrumbs: [
        { title: 'Bookings', href: lessor.bookings.calendar() },
        { title: 'Add a booking', href: lessor.bookings.create() },
    ],
};
