import { Head } from '@inertiajs/react';
import CarController from '@/actions/App/Http/Controllers/Lessor/CarController';
import type { CarFormOptions } from '@/components/cars/car-form/car-form';
import { CarForm } from '@/components/cars/car-form/car-form';
import { PageHeader } from '@/components/lessor/page-header';
import lessor from '@/routes/lessor';

export default function LessorCarsCreate(options: CarFormOptions) {
    return (
        <>
            <Head title="List a car" />

            <div className="mx-auto w-full max-w-4xl space-y-8 p-4 md:p-8">
                <PageHeader
                    eyebrow="New listing"
                    title="List a car"
                    description="Saved as a draft. Submit it for review when everything looks right."
                />
                <CarForm
                    form={CarController.store.form()}
                    options={options}
                    submitLabel="Save draft"
                />
            </div>
        </>
    );
}

LessorCarsCreate.layout = {
    breadcrumbs: [
        { title: 'My cars', href: lessor.cars.index() },
        { title: 'List a car', href: lessor.cars.create() },
    ],
};
