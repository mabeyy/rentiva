import type { LucideIcon } from 'lucide-react';
import type { CSSProperties } from 'react';
import {
    Calendar,
    Cog,
    DoorOpen,
    Fuel,
    Gauge,
    Luggage,
    Palette,
    Route,
    Users,
} from 'lucide-react';
import { isTwoWheeler } from '@/lib/vehicle';
import type { Car } from '@/types';

type Highlight = { icon: LucideIcon; value: string; label: string };
type Detail = { icon: LucideIcon; label: string; value: string };

/** The four numbers renters compare first, shown large. */
function highlightsFor(car: Car): Highlight[] {
    const economy = car.fuel_economy_highway ?? car.fuel_economy_city;
    const twoWheeler = isTwoWheeler(car.body_type.value);

    return [
        {
            icon: Users,
            value: String(car.seats),
            label: twoWheeler
                ? car.seats === 1
                    ? 'rider'
                    : 'riders'
                : 'seats',
        },
        ...(car.luggage_capacity > 0
            ? [
                  {
                      icon: Luggage,
                      value: String(car.luggage_capacity),
                      label: twoWheeler ? 'helmet storage' : 'bags',
                  },
              ]
            : []),
        { icon: Cog, value: car.transmission.label, label: 'transmission' },
        ...(economy !== null
            ? [
                  {
                      icon: Gauge,
                      value: String(economy),
                      label: car.fuel_economy_highway
                          ? 'km/L highway'
                          : 'km/L city',
                  },
              ]
            : []),
    ];
}

function detailsFor(car: Car): Detail[] {
    return [
        { icon: Fuel, label: 'Fuel', value: car.fuel_type.label },
        ...(car.drivetrain
            ? [
                  {
                      icon: Route,
                      label: 'Drivetrain',
                      value: car.drivetrain.label,
                  },
              ]
            : []),
        ...(car.doors !== null
            ? [{ icon: DoorOpen, label: 'Doors', value: String(car.doors) }]
            : []),
        { icon: Calendar, label: 'Model year', value: String(car.year) },
        { icon: Palette, label: 'Color', value: car.exterior_color },
        ...(car.fuel_economy_city !== null && car.fuel_economy_highway !== null
            ? [
                  {
                      icon: Gauge,
                      label: 'City economy',
                      value: `${car.fuel_economy_city} km/L`,
                  },
              ]
            : []),
    ];
}

/**
 * A car's spec sheet: headline numbers in a ruled strip, then the remaining
 * details as a compact two-column list.
 */
export function CarSpecList({ car }: { car: Car }) {
    const highlights = highlightsFor(car);

    return (
        <div className="overflow-hidden rounded-3xl border">
            <dl
                className="grid grid-cols-2 gap-px bg-border sm:grid-cols-[repeat(var(--count),minmax(0,1fr))]"
                style={{ '--count': highlights.length } as CSSProperties}
            >
                {highlights.map(({ icon: Icon, value, label }) => (
                    <div
                        key={label}
                        className="flex flex-col bg-background p-5"
                    >
                        <Icon className="size-4 text-brand" />
                        <dt className="order-last mt-1 text-sm text-muted-foreground">
                            {label}
                        </dt>
                        <dd className="mt-3 font-display text-2xl leading-none font-extrabold tracking-tight">
                            {value}
                        </dd>
                    </div>
                ))}
            </dl>

            <dl className="grid gap-x-8 border-t bg-muted/30 px-5 py-2 sm:grid-cols-2">
                {detailsFor(car).map(({ icon: Icon, label, value }) => (
                    <div
                        key={label}
                        className="flex items-center justify-between gap-4 border-b border-dashed py-2.5 text-sm last:border-b-0 sm:[&:nth-last-child(2):nth-child(odd)]:border-b-0"
                    >
                        <dt className="flex items-center gap-2 text-muted-foreground">
                            <Icon className="size-4" />
                            {label}
                        </dt>
                        <dd className="font-medium">{value}</dd>
                    </div>
                ))}
            </dl>
        </div>
    );
}
