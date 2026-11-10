import type { TrafficSource } from '@/components/analytics/traffic-sources';
import { TrafficSources } from '@/components/analytics/traffic-sources';
import { InfoTip } from '@/components/info-tip';

export type PlatformTraffic = {
    owners: {
        home_visitors: number;
        signup_visitors: number;
        signups: number;
        added_car: number;
        got_request: number;
    };
    renters: {
        directory_visitors: number;
        booking_page_visitors: number;
        requests: number;
    };
    sources: TrafficSource[];
};

type Step = { label: string; value: number };

/** Percent of the previous step, e.g. "42% of the step before". */
function stepRate(value: number, previous: number | undefined): string | null {
    if (previous === undefined || previous === 0) {
        return null;
    }

    return `${Math.round((value / previous) * 100)}%`;
}

/**
 * One funnel as bars sized against its first step, with the share that
 * made it from the step before.
 */
function Funnel({ title, steps }: { title: string; steps: Step[] }) {
    const top = Math.max(1, steps[0]?.value ?? 0, ...steps.map((s) => s.value));

    return (
        <div className="space-y-3">
            <h3 className="text-sm font-semibold">{title}</h3>
            <ol className="space-y-2.5">
                {steps.map((step, index) => {
                    const rate = stepRate(step.value, steps[index - 1]?.value);

                    return (
                        <li key={step.label} className="text-sm">
                            <div className="flex items-baseline justify-between gap-3">
                                <span>{step.label}</span>
                                <span className="flex items-baseline gap-2">
                                    {rate && (
                                        <span className="text-xs text-muted-foreground">
                                            {rate}
                                        </span>
                                    )}
                                    <span className="font-medium tabular-nums">
                                        {step.value.toLocaleString()}
                                    </span>
                                </span>
                            </div>
                            <div className="mt-1 h-2 rounded-full bg-muted">
                                <div
                                    className="h-full rounded-full bg-brand"
                                    style={{
                                        width: `${(step.value / top) * 100}%`,
                                    }}
                                />
                            </div>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}

/**
 * Rentiva's last 30 days: how visitors become owners who get bookings, how
 * renters reach booking pages, and where traffic comes from.
 */
export function GrowthFunnel({ traffic }: { traffic: PlatformTraffic }) {
    return (
        <section className="space-y-5 rounded-xl border p-5">
            <div>
                <h2 className="text-lg font-semibold">Growth</h2>
                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    Last 30 days, counted without cookies.
                    <InfoTip>
                        Visitors count once a day, and signed-in users aren't
                        counted. The percentage beside each step is the share of
                        people who made it from the step before.
                    </InfoTip>
                </p>
            </div>
            <div className="grid gap-8 lg:grid-cols-3">
                <Funnel
                    title="Owners"
                    steps={[
                        {
                            label: 'Visited the home page',
                            value: traffic.owners.home_visitors,
                        },
                        {
                            label: 'Opened sign up',
                            value: traffic.owners.signup_visitors,
                        },
                        { label: 'Signed up', value: traffic.owners.signups },
                        {
                            label: 'Added a car',
                            value: traffic.owners.added_car,
                        },
                        {
                            label: 'Got a booking request',
                            value: traffic.owners.got_request,
                        },
                    ]}
                />
                <Funnel
                    title="Renters"
                    steps={[
                        {
                            label: 'Visited a booking page',
                            value: traffic.renters.booking_page_visitors,
                        },
                        {
                            label: 'Sent a booking request',
                            value: traffic.renters.requests,
                        },
                    ]}
                />
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold">
                        Where visitors came from
                    </h3>
                    <TrafficSources sources={traffic.sources} />
                    <p className="text-xs text-muted-foreground">
                        {traffic.renters.directory_visitors.toLocaleString()}{' '}
                        visited the Rent a car directory.
                    </p>
                </div>
            </div>
        </section>
    );
}
