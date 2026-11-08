import { CalendarDays, Cog, Fuel, Users } from 'lucide-react';

/**
 * A phone showing an owner's booking page: the product, not a stock illustration.
 * Static markup only; it is decoration, so it is hidden from assistive tech.
 */
export function BookingPageMockup() {
    return (
        <div
            aria-hidden
            className="w-[290px] rounded-[2.6rem] border-[10px] border-ink bg-background shadow-2xl shadow-ink/30 dark:border-neutral-800"
        >
            <div className="mx-auto mt-2 h-1.5 w-16 rounded-full bg-ink/15" />
            <div className="flex items-center gap-2.5 px-4 pt-3 pb-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-brand font-display text-xs font-bold text-brand-foreground">
                    AB
                </div>
                <div className="leading-tight">
                    <p className="text-[13px] font-semibold">ABQ Car Rental</p>
                    <p className="text-[11px] text-muted-foreground">
                        Cagayan de Oro City
                    </p>
                </div>
            </div>
            <img
                src="/images/landing/rav4-red.jpg"
                alt=""
                className="aspect-[4/3] w-full object-cover"
            />
            <div className="space-y-3 p-4">
                <div className="flex items-baseline justify-between">
                    <p className="font-display text-[17px] font-bold">
                        2025 Toyota RAV4
                    </p>
                    <p className="text-[13px]">
                        <span className="font-semibold">₱3,500</span>
                        <span className="text-muted-foreground">/day</span>
                    </p>
                </div>
                <div className="flex gap-1.5 text-[11px] text-muted-foreground">
                    {[
                        { icon: Users, label: '5 seats' },
                        { icon: Cog, label: 'Auto' },
                        { icon: Fuel, label: '14.9 km/L' },
                    ].map(({ icon: Icon, label }) => (
                        <span
                            key={label}
                            className="flex items-center gap-1 rounded-full bg-muted px-2 py-1"
                        >
                            <Icon className="size-3" /> {label}
                        </span>
                    ))}
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                    {[
                        { label: 'Pickup', value: 'Fri, Nov 14' },
                        { label: 'Return', value: 'Mon, Nov 17' },
                    ].map(({ label, value }) => (
                        <div
                            key={label}
                            className="rounded-lg border px-2.5 py-2"
                        >
                            <p className="text-muted-foreground">{label}</p>
                            <p className="flex items-center gap-1 font-medium">
                                <CalendarDays className="size-3" /> {value}
                            </p>
                        </div>
                    ))}
                </div>
                <div className="flex justify-between border-t pt-2.5 text-[12px]">
                    <span className="text-muted-foreground">
                        3 days · pay at pickup
                    </span>
                    <span className="font-semibold">₱10,500</span>
                </div>
                <div className="rounded-xl bg-brand py-2.5 text-center text-[13px] font-semibold text-brand-foreground">
                    Request to book
                </div>
            </div>
        </div>
    );
}
