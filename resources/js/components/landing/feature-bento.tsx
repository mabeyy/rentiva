import type { LucideIcon } from 'lucide-react';
import {
    Banknote,
    Check,
    Cog,
    DoorOpen,
    Fuel,
    Gauge,
    Landmark,
    Luggage,
    Route,
    Smartphone,
    Users,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

function Tile({
    title,
    description,
    className,
    children,
}: {
    title: string;
    description: string;
    className?: string;
    children: ReactNode;
}) {
    return (
        <div
            className={cn(
                'flex flex-col gap-8 rounded-3xl border bg-background p-6 sm:p-8',
                className,
            )}
        >
            <div>
                <h3 className="font-display text-2xl font-bold tracking-tight">
                    {title}
                </h3>
                <p className="mt-2 text-muted-foreground">{description}</p>
            </div>
            <div aria-hidden className="flex flex-1 flex-col justify-center">
                {children}
            </div>
        </div>
    );
}

/**
 * Round a day's cell so consecutive days in a range read as one strip,
 * breaking cleanly at the end of each week row.
 */
function rangeShape(day: number, days: number[]): string {
    if (!days.includes(day)) {
        return 'rounded-full';
    }

    const weekday = (day - 1) % 7; // November 2026 starts on a Sunday.
    const startsStrip = weekday === 0 || !days.includes(day - 1);
    const endsStrip = weekday === 6 || !days.includes(day + 1);

    return cn(startsStrip && 'rounded-l-full', endsStrip && 'rounded-r-full');
}

/** Grey struck-through days are taken; brand days are the renter's pick. */
function MiniCalendar() {
    const booked = [6, 7, 8, 20, 21];
    const selected = [14, 15, 16, 17];

    return (
        <div className="rounded-2xl border bg-muted/40 p-4">
            <div className="mb-3 flex items-center justify-between text-sm">
                <span className="font-semibold">November 2026</span>
                <span className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <span className="size-2.5 rounded-full bg-brand" /> Your
                        trip
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="size-2.5 rounded-full bg-muted-foreground/30" />{' '}
                        Booked
                    </span>
                </span>
            </div>
            <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                    <span key={index} className="pb-1 text-muted-foreground">
                        {day}
                    </span>
                ))}
                {Array.from({ length: 30 }, (_, index) => index + 1).map(
                    (day) => (
                        <span
                            key={day}
                            className={cn(
                                'flex h-8 items-center justify-center',
                                rangeShape(
                                    day,
                                    selected.includes(day) ? selected : booked,
                                ),
                                booked.includes(day) &&
                                    'bg-muted-foreground/15 text-muted-foreground/60 line-through',
                                selected.includes(day) &&
                                    'bg-brand font-semibold text-brand-foreground',
                            )}
                        >
                            {day}
                        </span>
                    ),
                )}
            </div>
        </div>
    );
}

function RequestList() {
    const requests = [
        { name: 'Juan D.', detail: 'RAV4 · Nov 14–17', confirmed: true },
        { name: 'Mika R.', detail: 'Corolla · Nov 18–19' },
        { name: 'Paolo S.', detail: 'Highlander · Nov 21–23' },
    ];

    return (
        <ul className="space-y-2">
            {requests.map((request) => (
                <li
                    key={request.name}
                    className="flex items-center justify-between gap-3 rounded-2xl border bg-muted/40 px-4 py-3"
                >
                    <div className="min-w-0">
                        <p className="text-sm font-semibold">{request.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                            {request.detail}
                        </p>
                    </div>
                    {request.confirmed ? (
                        <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            <Check className="size-3.5" /> Confirmed
                        </span>
                    ) : (
                        <span className="shrink-0 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-brand-foreground">
                            Confirm
                        </span>
                    )}
                </li>
            ))}
        </ul>
    );
}

function SpecSheet() {
    const specs: { icon: LucideIcon; value: string; label: string }[] = [
        { icon: Users, value: '7', label: 'Seats' },
        { icon: Luggage, value: '4', label: 'Bags' },
        { icon: Gauge, value: '12.3', label: 'km/L hwy' },
        { icon: Cog, value: 'Auto', label: 'Transmission' },
        { icon: Fuel, value: 'Gas', label: 'Fuel' },
        { icon: Route, value: '4WD', label: 'Drivetrain' },
    ];

    return (
        <div className="rounded-2xl border bg-muted/40 p-4">
            <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold">2019 Toyota Highlander</p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <DoorOpen className="size-3.5" /> 4 doors
                </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
                {specs.map(({ icon: Icon, value, label }) => (
                    <div key={label} className="rounded-xl bg-background p-3">
                        <Icon className="size-4 text-brand" />
                        <p className="mt-2 font-display text-lg leading-none font-bold">
                            {value}
                        </p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                            {label}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

function PickupReceipt() {
    const methods: { icon: LucideIcon; label: string }[] = [
        { icon: Banknote, label: 'Cash' },
        { icon: Smartphone, label: 'GCash' },
        { icon: Landmark, label: 'Bank transfer' },
    ];

    return (
        <div className="rounded-2xl border bg-muted/40 p-5">
            <div className="flex justify-between text-sm text-muted-foreground tabular-nums">
                <span>₱3,500 × 3 days</span>
                <span>₱10,500</span>
            </div>
            <div className="my-3 border-t border-dashed" />
            <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium">Collect at pickup</span>
                <span className="font-display text-3xl font-extrabold text-brand tabular-nums">
                    ₱10,500
                </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
                {methods.map(({ icon: Icon, label }) => (
                    <span
                        key={label}
                        className="flex items-center gap-1.5 rounded-full bg-background px-3 py-1.5 text-xs font-medium"
                    >
                        <Icon className="size-3.5 text-muted-foreground" />{' '}
                        {label}
                    </span>
                ))}
            </div>
        </div>
    );
}

export function FeatureBento() {
    return (
        <section className="bg-background">
            <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
                <p className="text-sm font-semibold tracking-widest text-muted-foreground uppercase">
                    Features
                </p>
                <h2 className="mt-3 max-w-3xl font-display text-4xl font-bold tracking-tight text-balance sm:text-5xl">
                    Built for how rentals actually run here.
                </h2>
                <div className="mt-12 grid gap-4 lg:grid-cols-6">
                    <Tile
                        className="lg:col-span-4 lg:grid lg:grid-cols-[1fr_1.15fr] lg:items-center lg:gap-10"
                        title="Double bookings, gone."
                        description="Requested and confirmed days are blocked automatically, so renters only ever pick dates that are really free."
                    >
                        <MiniCalendar />
                    </Tile>
                    <Tile
                        className="lg:col-span-2"
                        title="You approve every booking."
                        description="Nothing is final until you tap confirm."
                    >
                        <RequestList />
                    </Tile>
                    <Tile
                        className="lg:col-span-3"
                        title="The specs renters ask about."
                        description="Answered on your page, before they message you."
                    >
                        <SpecSheet />
                    </Tile>
                    <Tile
                        className="lg:col-span-3"
                        title="Paid at pickup."
                        description="No card payments to set up. Renters see the total upfront and pay you directly."
                    >
                        <PickupReceipt />
                    </Tile>
                </div>
            </div>
        </section>
    );
}
