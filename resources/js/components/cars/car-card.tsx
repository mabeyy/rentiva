import { Link } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import { Bike, CarFront, Cog, MapPin, Users } from 'lucide-react';
import { formatPeso } from '@/lib/format';
import { isTwoWheeler } from '@/lib/vehicle';
import type { Car } from '@/types';
import type { RouteDefinition } from '@/wayfinder';

/**
 * A car in a fleet grid: a framed photo, then name and price on one line and
 * the specs renters compare first on the next.
 */
export function CarCard({
    car,
    href,
}: {
    car: Car;
    /** Details page link, including any search params (e.g. dates) to carry over. */
    href: RouteDefinition<'get'>;
}) {
    const twoWheeler = isTwoWheeler(car.body_type.value);
    const VehicleIcon = twoWheeler ? Bike : CarFront;
    const details: { icon: LucideIcon; label: string }[] = [
        { icon: MapPin, label: car.location },
        {
            icon: Users,
            label: `${car.seats} ${twoWheeler ? (car.seats === 1 ? 'rider' : 'riders') : 'seats'}`,
        },
        { icon: Cog, label: car.transmission.label },
    ];

    return (
        <Link
            href={href}
            prefetch
            className="group flex flex-col gap-4 rounded-3xl border bg-background p-2 pb-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_-24px_color-mix(in_oklch,var(--ink)_40%,transparent)] focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
        >
            <div className="relative aspect-[4/3] overflow-hidden rounded-[1.1rem] bg-muted">
                {car.cover_image ? (
                    <img
                        src={car.cover_image.url}
                        alt={car.name}
                        loading="lazy"
                        className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                ) : (
                    <div className="flex size-full items-center justify-center">
                        <VehicleIcon className="size-10 text-muted-foreground/40" />
                    </div>
                )}
                <span className="absolute top-3 left-3 flex items-center gap-1 rounded-md bg-ink px-2 py-1 text-[10px] leading-none font-bold tracking-[0.14em] text-ink-foreground uppercase shadow-md">
                    <VehicleIcon aria-hidden className="size-3 text-brand" />
                    {car.body_type.label}
                </span>
            </div>

            <div className="space-y-2 px-3">
                <div className="flex items-end justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                            {car.make}
                        </p>
                        <h3 className="mt-0.5 flex min-w-0 items-center gap-2 font-display text-xl leading-tight font-bold tracking-tight">
                            <span className="truncate">{car.model}</span>
                            <span className="shrink-0 rounded-md border px-1.5 py-0.5 font-sans text-[11px] leading-none font-medium tracking-normal text-muted-foreground">
                                {car.year}
                            </span>
                        </h3>
                    </div>
                    <p className="shrink-0 leading-tight">
                        <span className="font-display text-xl font-extrabold tabular-nums">
                            {formatPeso(car.daily_rate)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                            /day
                        </span>
                    </p>
                </div>
                <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    {details.map(({ icon: Icon, label }) => (
                        <li
                            key={label}
                            className="flex min-w-0 items-center gap-1.5"
                        >
                            <Icon className="size-3.5 shrink-0 text-brand" />
                            <span className="truncate">{label}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </Link>
    );
}
