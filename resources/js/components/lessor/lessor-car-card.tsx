import { Link } from '@inertiajs/react';
import {
    Bike,
    CalendarCheck,
    CarFront,
    EyeOff,
    MapPin,
    Pencil,
} from 'lucide-react';
import { CarActivationSwitch } from '@/components/lessor/car-activation-switch';
import { StatusBadge } from '@/components/status-badge';
import { formatPeso } from '@/lib/format';
import { cn } from '@/lib/utils';
import { isTwoWheeler } from '@/lib/vehicle';
import lessor from '@/routes/lessor';
import type { Car } from '@/types';

/**
 * One of the owner's own listings: photo first, then name, rate and bookings,
 * with the visibility switch. The whole card opens the editor.
 */
export function LessorCarCard({ car }: { car: Car }) {
    const bookingsCount = car.bookings_count ?? 0;
    const VehicleIcon = isTwoWheeler(car.body_type.value) ? Bike : CarFront;
    const isHidden = car.status.value === 'inactive';
    const isToggleable = ['active', 'inactive'].includes(car.status.value);

    return (
        <div className="group relative flex flex-col overflow-hidden rounded-3xl border bg-background transition-all hover:-translate-y-0.5 hover:shadow-[0_24px_48px_-24px_color-mix(in_oklch,var(--ink)_40%,transparent)]">
            <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                {car.cover_image ? (
                    <img
                        src={car.cover_image.url}
                        alt=""
                        className={cn(
                            'size-full object-cover transition-all duration-500 group-hover:scale-[1.03]',
                            isHidden && 'grayscale-[60%]',
                        )}
                    />
                ) : (
                    <div className="flex size-full items-center justify-center">
                        <VehicleIcon className="size-10 text-muted-foreground/40" />
                    </div>
                )}

                {isHidden ? (
                    <span className="absolute top-3 left-3 flex items-center gap-1 rounded-md bg-ink px-2 py-1 text-[10px] leading-none font-bold tracking-[0.14em] text-ink-foreground uppercase shadow-md">
                        <EyeOff aria-hidden className="size-3" /> Hidden
                    </span>
                ) : (
                    !isToggleable && (
                        <div className="absolute top-3 left-3">
                            <StatusBadge status={car.status} />
                        </div>
                    )
                )}

                <span
                    aria-hidden
                    className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-full bg-background/90 text-foreground opacity-0 shadow-md backdrop-blur transition-opacity group-hover:opacity-100"
                >
                    <Pencil className="size-3.5" />
                </span>
            </div>

            <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="min-w-0">
                    <p className="text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                        {car.make}
                    </p>
                    <h3 className="mt-0.5 flex min-w-0 items-center gap-2 font-display text-lg leading-tight font-bold tracking-tight">
                        <Link
                            href={lessor.cars.edit(car.slug)}
                            className="truncate outline-none after:absolute after:inset-0 after:rounded-3xl focus-visible:after:ring-2 focus-visible:after:ring-brand"
                        >
                            {car.model}
                        </Link>
                        <span className="shrink-0 rounded-md border px-1.5 py-0.5 font-sans text-[11px] leading-none font-medium tracking-normal text-muted-foreground">
                            {car.year}
                        </span>
                    </h3>
                    <p className="mt-1 flex min-w-0 items-center gap-1 truncate text-xs text-muted-foreground">
                        <MapPin className="size-3.5 text-brand" />{' '}
                        {car.location}
                    </p>
                </div>

                <div className="mt-auto flex items-center justify-between gap-2 border-t border-dashed pt-3">
                    <div>
                        <p className="text-sm text-muted-foreground">
                            <span className="font-display text-lg font-extrabold text-foreground tabular-nums">
                                {formatPeso(car.daily_rate)}
                            </span>
                            /day
                        </p>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <CalendarCheck className="size-3.5" />{' '}
                            {bookingsCount}{' '}
                            {bookingsCount === 1 ? 'booking' : 'bookings'}
                        </p>
                    </div>
                    <div className="relative z-10">
                        <CarActivationSwitch car={car} />
                    </div>
                </div>
            </div>
        </div>
    );
}
