import { Link } from '@inertiajs/react';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { formatPeso } from '@/lib/format';
import admin from '@/routes/admin';

export type SubscriptionMetrics = {
    /** Monthly recurring revenue in centavos; yearly plans count as 1/12. */
    mrr: number;
    paying_owners: number;
    owners_without_plan: number;
    yearly_owners: number;
    plans: { name: string; owners: number }[];
    collected_this_month: number;
    outstanding: number;
    overdue_owners: number;
    payments_to_check: number;
};

function Figure({
    label,
    value,
    hint,
}: {
    label: string;
    value: string;
    hint?: string;
}) {
    return (
        <div>
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="mt-1 font-display text-2xl font-extrabold tracking-tight tabular-nums">
                {value}
            </p>
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
    );
}

/**
 * How Rentiva itself is earning: recurring revenue, owners per plan, and
 * money still to collect or check.
 */
export function SubscriptionOverview({
    metrics,
}: {
    metrics: SubscriptionMetrics;
}) {
    const totalOwners = metrics.paying_owners + metrics.owners_without_plan;

    return (
        <section className="space-y-4 rounded-xl border p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold">Subscriptions</h2>
                <Link
                    href={admin.billing.index()}
                    className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                    Billing <ArrowRight className="size-4" />
                </Link>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <Figure
                    label="Monthly recurring revenue"
                    value={formatPeso(metrics.mrr)}
                    hint={`${metrics.yearly_owners} on yearly billing`}
                />
                <Figure
                    label="Paying owners"
                    value={String(metrics.paying_owners)}
                    hint={`${metrics.owners_without_plan} without a plan`}
                />
                <Figure
                    label="Collected this month"
                    value={formatPeso(metrics.collected_this_month)}
                />
                <Figure
                    label="Still to collect"
                    value={formatPeso(metrics.outstanding)}
                    hint={`${metrics.overdue_owners} ${metrics.overdue_owners === 1 ? 'owner' : 'owners'} overdue`}
                />
            </div>

            {totalOwners > 0 && (
                <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">
                        Owners by plan
                    </p>
                    <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
                        {metrics.plans.map((plan, index) => (
                            <span
                                key={plan.name}
                                title={`${plan.name}: ${plan.owners}`}
                                className="h-full bg-brand"
                                style={{
                                    width: `${(plan.owners / totalOwners) * 100}%`,
                                    opacity: 1 - index * 0.25,
                                }}
                            />
                        ))}
                    </div>
                    <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {metrics.plans.map((plan, index) => (
                            <span
                                key={plan.name}
                                className="flex items-center gap-1.5"
                            >
                                <span
                                    className="size-2 rounded-full bg-brand"
                                    style={{ opacity: 1 - index * 0.25 }}
                                />
                                {plan.name} · {plan.owners}
                            </span>
                        ))}
                        <span className="flex items-center gap-1.5">
                            <span className="size-2 rounded-full bg-muted-foreground/30" />
                            No plan · {metrics.owners_without_plan}
                        </span>
                    </p>
                </div>
            )}

            {metrics.payments_to_check > 0 && (
                <Link
                    href={admin.billing.index({
                        query: { status: 'submitted' },
                    })}
                    className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-900 hover:bg-amber-500/15 dark:text-amber-200"
                >
                    <AlertTriangle className="size-4" />
                    {metrics.payments_to_check}{' '}
                    {metrics.payments_to_check === 1 ? 'payment' : 'payments'}{' '}
                    to check
                </Link>
            )}
        </section>
    );
}
