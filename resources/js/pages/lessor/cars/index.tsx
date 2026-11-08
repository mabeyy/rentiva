import { Head, Link } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import { CarFront, LayoutGrid, List, Pencil, Plus } from 'lucide-react';
import { CarsTable } from '@/components/cars/cars-table';
import { EmptyState } from '@/components/empty-state';
import { CarActivationSwitch } from '@/components/lessor/car-activation-switch';
import { LessorCarCard } from '@/components/lessor/lessor-car-card';
import { PageHeader } from '@/components/lessor/page-header';
import { BrandButton } from '@/components/public/brand-button';
import { useStoredChoice } from '@/hooks/use-stored-choice';
import { cn } from '@/lib/utils';
import lessor from '@/routes/lessor';
import type { Car } from '@/types';

const views = ['grid', 'list'] as const;

const layoutOptions: {
    value: (typeof views)[number];
    label: string;
    icon: LucideIcon;
}[] = [
    { value: 'grid', label: 'Grid', icon: LayoutGrid },
    { value: 'list', label: 'List', icon: List },
];

export default function LessorCarsIndex({ cars }: { cars: Car[] }) {
    const [view, setView] = useStoredChoice('lessor-cars-view', views, 'grid');

    return (
        <>
            <Head title="My cars" />

            <div className="space-y-8 p-4 md:p-8">
                <PageHeader
                    eyebrow="Your fleet"
                    title="My cars"
                    description="Listings go live after an admin approves them."
                    actions={
                        <>
                            {cars.length > 0 && (
                                <div
                                    role="radiogroup"
                                    aria-label="Layout"
                                    className="flex h-11 items-center gap-1 rounded-full border bg-background p-1"
                                >
                                    {layoutOptions.map(
                                        ({ value, label, icon: Icon }) => (
                                            <button
                                                key={value}
                                                type="button"
                                                role="radio"
                                                aria-checked={view === value}
                                                onClick={() => setView(value)}
                                                className={cn(
                                                    'flex h-full items-center gap-1.5 rounded-full px-4 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50 [&_svg]:size-4',
                                                    view === value
                                                        ? 'bg-ink text-ink-foreground'
                                                        : 'text-muted-foreground hover:text-foreground',
                                                )}
                                            >
                                                <Icon /> {label}
                                            </button>
                                        ),
                                    )}
                                </div>
                            )}
                            <BrandButton
                                size="lg"
                                className="rounded-full px-6"
                                asChild
                            >
                                <Link href={lessor.cars.create()}>
                                    <Plus /> List a car
                                </Link>
                            </BrandButton>
                        </>
                    }
                />

                {cars.length === 0 ? (
                    <EmptyState
                        icon={CarFront}
                        title="No cars yet"
                        description="Add your first car to start receiving bookings."
                        action={
                            <BrandButton className="rounded-full px-5" asChild>
                                <Link href={lessor.cars.create()}>
                                    List a car
                                </Link>
                            </BrandButton>
                        }
                    />
                ) : view === 'grid' ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {cars.map((car) => (
                            <LessorCarCard key={car.id} car={car} />
                        ))}
                    </div>
                ) : (
                    <CarsTable
                        cars={cars}
                        actionLabel="Edit"
                        actionIcon={Pencil}
                        actionHref={(car) => lessor.cars.edit(car.slug)}
                        statusAction={(car) => (
                            <CarActivationSwitch car={car} />
                        )}
                    />
                )}
            </div>
        </>
    );
}

LessorCarsIndex.layout = {
    breadcrumbs: [{ title: 'My cars', href: lessor.cars.index() }],
};
