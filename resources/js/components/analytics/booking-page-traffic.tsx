import type { TrafficSource } from '@/components/analytics/traffic-sources';
import { InfoTip } from '@/components/info-tip';
import { TrafficSources } from '@/components/analytics/traffic-sources';

export type BookingPageTraffic = {
    visitors: number;
    car_views: number;
    requests: number;
    /** Requests per 100 visitors; null before anyone visits. */
    request_rate: number | null;
    sources: TrafficSource[];
    cars: { name: string; views: number; requests: number }[];
};

function Figure({
    label,
    value,
    hint,
    info,
}: {
    label: string;
    value: string;
    hint: string;
    info: string;
}) {
    return (
        <div>
            <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                {label}
                <InfoTip>{info}</InfoTip>
            </p>
            <p className="mt-1 font-display text-2xl font-extrabold tracking-tight tabular-nums">
                {value}
            </p>
            <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
    );
}

/**
 * How the owner's booking page did over the last 30 days: visitors, how many
 * asked to book, where they came from, and which cars get looked at. Laid
 * out as a narrow column for the dashboard's side.
 */
export function BookingPageTrafficCard({
    traffic,
}: {
    traffic: BookingPageTraffic;
}) {
    return (
        <section className="space-y-5 rounded-3xl border bg-background p-5">
            <div>
                <h2 className="font-display text-lg font-bold tracking-tight">
                    Page visits
                </h2>
                <p className="text-xs text-muted-foreground">
                    Last 30 days · each visitor counts once a day
                </p>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                <Figure
                    label="Visitors"
                    value={traffic.visitors.toLocaleString()}
                    hint="Opened your page"
                    info="People who opened your booking page or one of your cars. Each person counts once a day, and your own visits while signed in don't count."
                />
                <Figure
                    label="Requests"
                    value={traffic.requests.toLocaleString()}
                    hint="Sent online"
                    info="Booking requests renters sent from your booking page. Bookings you added yourself aren't counted."
                />
                <Figure
                    label="Request rate"
                    value={
                        traffic.request_rate === null
                            ? '–'
                            : `${traffic.request_rate}%`
                    }
                    hint="Per 100 visitors"
                    info="How many visitors out of every 100 sent a booking request. A higher rate means your page turns more visitors into bookings."
                />
                <Figure
                    label="Car views"
                    value={traffic.car_views.toLocaleString()}
                    hint="Car pages opened"
                    info="Times a car's page was opened, including the same person looking more than once."
                />
            </div>

            <div className="space-y-3 border-t pt-4">
                <h3 className="text-sm font-semibold">Where they came from</h3>
                <TrafficSources sources={traffic.sources} />
            </div>

            {traffic.cars.length > 0 && (
                <div className="space-y-2 border-t pt-4">
                    <div className="flex items-baseline justify-between gap-3 text-xs text-muted-foreground">
                        <h3 className="text-sm font-semibold text-foreground">
                            Most viewed cars
                        </h3>
                        <span>Views · requests</span>
                    </div>
                    <ul className="space-y-1.5 text-sm">
                        {traffic.cars.map((car) => (
                            <li
                                key={car.name}
                                className="flex items-baseline justify-between gap-3"
                            >
                                <span className="truncate">{car.name}</span>
                                <span className="shrink-0 text-muted-foreground tabular-nums">
                                    <span className="font-medium text-foreground">
                                        {car.views.toLocaleString()}
                                    </span>{' '}
                                    · {car.requests.toLocaleString()}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </section>
    );
}
