import { Head, Link } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { CarFront, FileWarning, Plus, Wallet, Wrench } from 'lucide-react';
import { useState } from 'react';
import type { CarServiceEntry } from '@/components/cars/car-services-card';
import { ServiceLogDialog } from '@/components/cars/car-services-card';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/lessor/page-header';
import { StatCard } from '@/components/stat-card';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatPeso } from '@/lib/format';
import { cn } from '@/lib/utils';
import lessor from '@/routes/lessor';

type MaintenanceCar = {
    slug: string;
    name: string;
    plate_number: string | null;
    days_since_service: number | null;
    service_due: boolean;
    registration_expires_on: string | null;
    registration_days_left: number | null;
    needs_attention: boolean;
    spent_this_year: number;
    services: CarServiceEntry[];
};

/** "Today", "12 days ago", "3 months ago". */
function ago(days: number): string {
    if (days === 0) {
        return 'Today';
    }

    if (days < 60) {
        return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }

    return `${Math.round(days / 30)} months ago`;
}

function RegistrationStatus({ car }: { car: MaintenanceCar }) {
    if (car.registration_expires_on === null) {
        return <span className="text-muted-foreground">Not set</span>;
    }

    const daysLeft = car.registration_days_left ?? 0;
    const date = format(parseISO(car.registration_expires_on), 'MMM d, yyyy');

    if (daysLeft < 0) {
        return (
            <span className="font-medium text-destructive">Expired {date}</span>
        );
    }

    return (
        <span
            className={cn(
                daysLeft <= 30 &&
                    'font-medium text-amber-700 dark:text-amber-400',
            )}
        >
            {daysLeft <= 30
                ? `Expires in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}`
                : date}
        </span>
    );
}

/**
 * Upkeep across the fleet: each car's last service and registration, what
 * was spent this year, and the cars that need attention listed first.
 */
export default function LessorMaintenance({
    cars,
    summary,
    serviceDueAfterDays,
}: {
    cars: MaintenanceCar[];
    summary: {
        spent_this_year: number;
        services_this_year: number;
        needs_attention: number;
    };
    serviceDueAfterDays: number;
}) {
    const [logging, setLogging] = useState<MaintenanceCar | null>(null);
    const dueMonths = Math.round(serviceDueAfterDays / 30);
    const serviceDue = cars.filter((car) => car.service_due).length;
    const registrationDue = cars.filter(
        (car) =>
            car.registration_days_left !== null &&
            car.registration_days_left <= 30,
    ).length;
    const registrationExpired = cars.filter(
        (car) =>
            car.registration_days_left !== null &&
            car.registration_days_left < 0,
    ).length;

    return (
        <>
            <Head title="Maintenance" />

            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8">
                <PageHeader
                    title="Maintenance"
                    description="Services and registration for every car, with the ones that need attention first."
                />

                {cars.length === 0 ? (
                    <EmptyState
                        icon={CarFront}
                        title="No cars yet"
                        description="Add a car to start tracking its services and registration."
                    />
                ) : (
                    <>
                        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                            <StatCard
                                dense
                                label="Service due"
                                value={serviceDue}
                                icon={Wrench}
                                highlighted={serviceDue > 0}
                                hint={
                                    serviceDue > 0
                                        ? `None logged in ${dueMonths} months`
                                        : 'All serviced'
                                }
                                info={`Cars with no service logged in the last ${dueMonths} months, including cars with nothing logged yet.`}
                            />
                            <StatCard
                                dense
                                label="Registration due"
                                value={registrationDue}
                                icon={FileWarning}
                                highlighted={registrationDue > 0}
                                hint={
                                    registrationExpired > 0
                                        ? `${registrationExpired} already expired`
                                        : registrationDue > 0
                                          ? 'Expires within 30 days'
                                          : 'All current'
                                }
                                info="Cars whose LTO registration has run out or runs out within 30 days. Cars without a registration date aren't counted."
                            />
                            <StatCard
                                dense
                                label="Spent this year"
                                value={formatPeso(summary.spent_this_year)}
                                icon={Wallet}
                                hint={`${summary.services_this_year} ${summary.services_this_year === 1 ? 'service' : 'services'} logged`}
                            />
                            <StatCard
                                dense
                                label="Average per car"
                                value={formatPeso(
                                    Math.round(
                                        summary.spent_this_year / cars.length,
                                    ),
                                )}
                                icon={CarFront}
                                hint={`This year, across ${cars.length} ${cars.length === 1 ? 'car' : 'cars'}`}
                                info="What you spent on upkeep this year divided by the cars in your fleet. Helps spot when one car costs more than it should."
                            />
                        </div>

                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Car</TableHead>
                                    <TableHead>Last service</TableHead>
                                    <TableHead className="text-right">
                                        Spent this year
                                    </TableHead>
                                    <TableHead>Registration</TableHead>
                                    <TableHead>
                                        <span className="sr-only">Actions</span>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {cars.map((car) => {
                                    const latest = car.services[0];

                                    return (
                                        <TableRow key={car.slug}>
                                            <TableCell>
                                                <Link
                                                    href={lessor.cars.edit(
                                                        car.slug,
                                                    )}
                                                    className="font-medium hover:underline"
                                                >
                                                    {car.name}
                                                </Link>
                                                <p className="text-xs text-muted-foreground">
                                                    {car.plate_number ??
                                                        'No plate'}
                                                </p>
                                            </TableCell>
                                            <TableCell className="max-w-72">
                                                {latest ? (
                                                    <>
                                                        <p
                                                            className={cn(
                                                                car.service_due &&
                                                                    'font-medium text-amber-700 dark:text-amber-400',
                                                            )}
                                                        >
                                                            {ago(
                                                                car.days_since_service ??
                                                                    0,
                                                            )}
                                                        </p>
                                                        <p className="truncate text-xs text-muted-foreground">
                                                            {latest.description}
                                                            {latest.odometer !==
                                                                null &&
                                                                ` · ${latest.odometer.toLocaleString()} km`}
                                                        </p>
                                                    </>
                                                ) : (
                                                    <p className="font-medium text-amber-700 dark:text-amber-400">
                                                        Nothing logged yet
                                                    </p>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums">
                                                {car.spent_this_year > 0 ? (
                                                    formatPeso(
                                                        car.spent_this_year,
                                                    )
                                                ) : (
                                                    <span className="text-muted-foreground">
                                                        –
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <RegistrationStatus car={car} />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="rounded-full"
                                                    onClick={() =>
                                                        setLogging(car)
                                                    }
                                                >
                                                    <Plus /> Log a service
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </>
                )}
            </div>

            {logging && (
                <ServiceLogDialog
                    key={logging.slug}
                    carSlug={logging.slug}
                    services={
                        cars.find((car) => car.slug === logging.slug)
                            ?.services ?? []
                    }
                    title={`Service history · ${logging.name}`}
                    open
                    onOpenChange={(isOpen) => !isOpen && setLogging(null)}
                />
            )}
        </>
    );
}

LessorMaintenance.layout = {
    breadcrumbs: [{ title: 'Maintenance', href: lessor.maintenance() }],
};
