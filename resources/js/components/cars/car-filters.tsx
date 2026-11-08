import { SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { DateRangePicker, toDateRange } from '@/components/date-range-picker';
import { FormField } from '@/components/form-field';
import { OptionSelect, toOptions } from '@/components/option-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { useQueryFilters } from '@/hooks/use-query-filters';
import { toIsoDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { CarSpecOptions } from '@/types';
import type { RouteDefinition } from '@/wayfinder';

export type CarFilterValues = {
    search?: string;
    body_type?: string;
    transmission?: string;
    fuel_type?: string;
    seats?: string;
    location?: string;
    max_rate?: string;
    start_date?: string;
    end_date?: string;
    sort?: string;
};

/**
 * The selected trip dates as a query string, so details pages pre-fill them.
 */
export function tripDatesQuery(
    filters: CarFilterValues,
): Record<string, string> | undefined {
    return filters.start_date && filters.end_date
        ? { start_date: filters.start_date, end_date: filters.end_date }
        : undefined;
}

const seatOptions = toOptions(['4', '5', '7', '8']).map((option) => ({
    ...option,
    label: `${option.value}+ seats`,
}));

/** Filters tucked behind "More filters"; a badge counts the active ones. */
const moreFilterKeys = ['search', 'max_rate', 'location', 'fuel_type'] as const;

/** Pill styling for the dropdowns that sit on the bar itself. */
const barSelectClassName = 'h-9 w-auto rounded-full bg-background pr-3 pl-4';

function Chip({
    isActive,
    onClick,
    children,
}: {
    isActive: boolean;
    onClick: () => void;
    children: string;
}) {
    return (
        <button
            type="button"
            aria-pressed={isActive}
            onClick={onClick}
            className={cn(
                'h-9 shrink-0 rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors',
                isActive
                    ? 'border-ink bg-ink text-ink-foreground dark:border-brand dark:bg-brand dark:text-brand-foreground'
                    : 'bg-background hover:border-foreground/30',
            )}
        >
            {children}
        </button>
    );
}

/**
 * Horizontal filter bar for a fleet. Dates, car type, transmission and seats
 * (what renters filter by most) stay visible; the rest sit in "More filters".
 * Pass only the body types the fleet has, so no chip leads to an empty page.
 */
export function CarFilters({
    route,
    filters,
    options,
    locations = [],
}: {
    /** The listing page the filters reload. */
    route: RouteDefinition<'get'>;
    filters: CarFilterValues;
    options: CarSpecOptions;
    locations?: string[];
}) {
    const { apply, reset } = useQueryFilters(route, filters);
    const [search, setSearch] = useState(filters.search ?? '');
    const [maxRate, setMaxRate] = useState(filters.max_rate ?? '');
    const activeMoreFilters = moreFilterKeys.filter((key) => filters[key]);

    return (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <DateRangePicker
                id="dates"
                className="h-9 rounded-full bg-background lg:w-64"
                value={toDateRange(filters.start_date, filters.end_date)}
                onChange={(range) => {
                    if (range?.from && range.to && range.from < range.to) {
                        apply({
                            start_date: toIsoDate(range.from),
                            end_date: toIsoDate(range.to),
                        });
                    }
                }}
            />

            <div className="-mx-4 flex min-w-0 flex-1 gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:px-0 lg:pb-0">
                {options.bodyTypes.length > 1 && (
                    <>
                        <Chip
                            isActive={!filters.body_type}
                            onClick={() => apply({ body_type: null })}
                        >
                            All cars
                        </Chip>
                        {options.bodyTypes.map((bodyType) => (
                            <Chip
                                key={bodyType.value}
                                isActive={filters.body_type === bodyType.value}
                                onClick={() =>
                                    apply({ body_type: bodyType.value })
                                }
                            >
                                {bodyType.label}
                            </Chip>
                        ))}
                    </>
                )}
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
                <OptionSelect
                    options={options.transmissions}
                    value={filters.transmission ?? null}
                    onChange={(value) => apply({ transmission: value })}
                    anyLabel="Any transmission"
                    className={barSelectClassName}
                />
                <OptionSelect
                    options={seatOptions}
                    value={filters.seats ?? null}
                    onChange={(value) => apply({ seats: value })}
                    anyLabel="Any seats"
                    className={barSelectClassName}
                />
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className="h-9 shrink-0 rounded-full bg-background"
                        >
                            <SlidersHorizontal /> More filters
                            {activeMoreFilters.length > 0 && (
                                <span className="flex size-5 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-brand-foreground">
                                    {activeMoreFilters.length}
                                </span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-80 space-y-4 p-4">
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                apply({ search, max_rate: maxRate });
                            }}
                            className="grid grid-cols-2 gap-3"
                        >
                            <FormField
                                id="search"
                                label="Make or model"
                                className="col-span-2"
                            >
                                <Input
                                    id="search"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    onBlur={() => apply({ search })}
                                    placeholder="e.g. Toyota"
                                />
                            </FormField>
                            <FormField
                                id="max_rate"
                                label="Max per day (₱)"
                                className="col-span-2"
                            >
                                <Input
                                    id="max_rate"
                                    type="number"
                                    min={1}
                                    inputMode="numeric"
                                    value={maxRate}
                                    onChange={(event) =>
                                        setMaxRate(event.target.value)
                                    }
                                    onBlur={() => apply({ max_rate: maxRate })}
                                    placeholder="Any"
                                />
                            </FormField>
                        </form>
                        <div className="grid grid-cols-2 gap-3">
                            {locations.length > 1 && (
                                <FormField
                                    id="location"
                                    label="Pickup location"
                                    className="col-span-2"
                                >
                                    <OptionSelect
                                        id="location"
                                        options={toOptions(locations)}
                                        value={filters.location ?? null}
                                        onChange={(location) =>
                                            apply({ location })
                                        }
                                        anyLabel="Anywhere"
                                    />
                                </FormField>
                            )}
                            <FormField
                                id="fuel_type"
                                label="Fuel"
                                className="col-span-2"
                            >
                                <OptionSelect
                                    id="fuel_type"
                                    options={options.fuelTypes}
                                    value={filters.fuel_type ?? null}
                                    onChange={(value) =>
                                        apply({ fuel_type: value })
                                    }
                                    anyLabel="Any"
                                />
                            </FormField>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full"
                            onClick={reset}
                        >
                            Clear all filters
                        </Button>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );
}
