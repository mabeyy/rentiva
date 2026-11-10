import { Head } from '@inertiajs/react';
import CarController from '@/actions/App/Http/Controllers/Lessor/CarController';
import type { CarFormOptions } from '@/components/cars/car-form/car-form';
import { CarForm, carFormSections } from '@/components/cars/car-form/car-form';
import { PageHeader } from '@/components/lessor/page-header';
import { SectionNav } from '@/components/lessor/section-nav';
import { cn } from '@/lib/utils';
import lessor from '@/routes/lessor';

/** How a new listing goes live, with the step the owner is on now. */
const listingSteps = [
    {
        title: 'Fill in the details',
        text: 'Save as a draft any time and come back later.',
    },
    {
        title: 'Submit for review',
        text: 'After saving you land on the car’s page, with a Submit button.',
    },
    {
        title: 'Goes live',
        text: 'An admin checks it, then renters can find and book it.',
    },
];

/**
 * Listing a new car: the form on the left; on the right how a listing goes
 * live and a menu that jumps to each section.
 */
export default function LessorCarsCreate(options: CarFormOptions) {
    return (
        <>
            <Head title="List a car" />

            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8">
                <PageHeader
                    title="List a car"
                    description="Add the details renters look at. It's saved as a draft until you submit it for review."
                />

                <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
                    <div className="order-2 lg:order-1">
                        <CarForm
                            form={CarController.store.form()}
                            options={options}
                            submitLabel="Save draft"
                            numbered={false}
                        />
                    </div>

                    <aside className="order-1 space-y-4 lg:order-2 lg:self-stretch">
                        <section className="rounded-3xl border bg-background p-5">
                            <h2 className="text-sm font-semibold">
                                How it goes live
                            </h2>
                            <ol className="mt-4 space-y-4">
                                {listingSteps.map((step, index) => (
                                    <li key={step.title} className="flex gap-3">
                                        <span
                                            className={cn(
                                                'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                                                index === 0
                                                    ? 'bg-brand text-brand-foreground'
                                                    : 'bg-muted text-muted-foreground',
                                            )}
                                        >
                                            {index + 1}
                                        </span>
                                        <div>
                                            <p
                                                className={cn(
                                                    'text-sm font-medium',
                                                    index > 0 &&
                                                        'text-muted-foreground',
                                                )}
                                            >
                                                {step.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {step.text}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        </section>
                        <SectionNav sections={carFormSections} />
                    </aside>
                </div>
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
