import { Link } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import { Bike, CarFront, ChevronRight, MapPin } from 'lucide-react';
import type { ReactNode } from 'react';
import { StatusBadge } from '@/components/status-badge';
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
import { isTwoWheeler } from '@/lib/vehicle';
import type { Car } from '@/types';
import type { RouteDefinition } from '@/wayfinder';

/**
 * Listings table shared by the lessor and admin areas.
 */
export function CarsTable({
    cars,
    showLessor = false,
    actionLabel,
    actionHref,
    actionIcon: ActionIcon,
    statusAction,
}: {
    cars: Car[];
    showLessor?: boolean;
    actionLabel: string;
    actionHref: (car: Car) => RouteDefinition<'get'>;
    /** Show the action as this icon alone, with the label for screen readers. */
    actionIcon?: LucideIcon;
    /** Extra control beside each status, e.g. the lessor's on/off switch. */
    statusAction?: (car: Car) => ReactNode;
}) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Vehicle</TableHead>
                    {showLessor && <TableHead>Lessor</TableHead>}
                    <TableHead>Pickup</TableHead>
                    <TableHead className="text-right">Daily rate</TableHead>
                    <TableHead className="text-right">Bookings</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead />
                </TableRow>
            </TableHeader>
            <TableBody>
                {cars.map((car) => {
                    const VehicleIcon = isTwoWheeler(car.body_type.value)
                        ? Bike
                        : CarFront;
                    const isOffline = ['inactive', 'suspended'].includes(
                        car.status.value,
                    );
                    const control = statusAction?.(car);

                    return (
                        <TableRow
                            key={car.id}
                            className={cn(isOffline && 'text-muted-foreground')}
                        >
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <div
                                        className={cn(
                                            'flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted',
                                            isOffline && 'opacity-60',
                                        )}
                                    >
                                        {car.cover_image ? (
                                            <img
                                                src={car.cover_image.url}
                                                alt=""
                                                className="size-full object-cover"
                                            />
                                        ) : (
                                            <VehicleIcon className="size-5 text-muted-foreground/40" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <Link
                                            href={actionHref(car)}
                                            className={cn(
                                                'block truncate font-semibold hover:underline',
                                                !isOffline && 'text-foreground',
                                            )}
                                        >
                                            {car.make} {car.model}
                                        </Link>
                                        <p className="truncate text-xs text-muted-foreground">
                                            {car.year} · {car.body_type.label} ·{' '}
                                            {car.transmission.label} ·{' '}
                                            {car.seats}{' '}
                                            {isTwoWheeler(car.body_type.value)
                                                ? 'riders'
                                                : 'seats'}
                                        </p>
                                    </div>
                                </div>
                            </TableCell>
                            {showLessor && (
                                <TableCell>{car.host_name}</TableCell>
                            )}
                            <TableCell>
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="size-3.5 shrink-0 text-brand" />
                                    {car.location}
                                </span>
                            </TableCell>
                            <TableCell className="text-right whitespace-nowrap">
                                <span
                                    className={cn(
                                        'font-display font-bold tabular-nums',
                                        !isOffline && 'text-foreground',
                                    )}
                                >
                                    {formatPeso(car.daily_rate)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    /day
                                </span>
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                                {car.bookings_count ?? 0}
                            </TableCell>
                            <TableCell>
                                {control &&
                                ['active', 'inactive'].includes(
                                    car.status.value,
                                ) ? (
                                    control
                                ) : (
                                    <StatusBadge status={car.status} />
                                )}
                            </TableCell>
                            <TableCell className="text-right">
                                {ActionIcon ? (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="rounded-full"
                                        title={actionLabel}
                                        asChild
                                    >
                                        <Link href={actionHref(car)}>
                                            <ActionIcon />
                                            <span className="sr-only">
                                                {actionLabel} {car.name}
                                            </span>
                                        </Link>
                                    </Button>
                                ) : (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="rounded-full"
                                        asChild
                                    >
                                        <Link href={actionHref(car)}>
                                            {actionLabel} <ChevronRight />
                                        </Link>
                                    </Button>
                                )}
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
}
