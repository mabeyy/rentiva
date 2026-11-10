import { useForm } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { PauseCircle } from 'lucide-react';
import type { FormEvent } from 'react';
import { OptionSelect } from '@/components/option-select';
import { Button } from '@/components/ui/button';
import { formatPeso } from '@/lib/format';
import { cn } from '@/lib/utils';
import admin from '@/routes/admin';

export type LessorSubscription = {
    plan_id: number | null;
    paused: boolean;
    priority_support: boolean;
    billing_cycle: 'monthly' | 'yearly';
    /** The last day already invoiced. */
    paid_through: string | null;
    /** Set when the owner cancelled: the plan's last day. */
    ends_on: string | null;
    /** A smaller plan or cycle switch waiting for the next period. */
    pending_plan: string | null;
} | null;

export type LessorInvoice = {
    id: number;
    number: string;
    plan_name: string;
    amount: number;
    status: string;
    period_start: string;
    is_overdue: boolean;
};

/**
 * An admin's view of one owner's plan: change it and see their latest
 * invoices.
 */
export function LessorPlanForm({
    lessorId,
    subscription,
    plans,
    invoices,
}: {
    lessorId: number;
    subscription: LessorSubscription;
    plans: { id: number; name: string; price: number }[];
    invoices: LessorInvoice[];
}) {
    const form = useForm({
        plan_id: subscription?.plan_id ? String(subscription.plan_id) : '',
    });

    function submit(event: FormEvent): void {
        event.preventDefault();
        form.transform((data) => ({
            plan_id: data.plan_id ? Number(data.plan_id) : null,
        }));
        form.put(admin.lessors.subscription.update(lessorId).url, {
            preserveScroll: true,
        });
    }

    return (
        <div className="space-y-4 rounded-xl border p-4">
            {subscription?.priority_support && (
                <p className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
                    Priority support: answer this owner first
                </p>
            )}
            {subscription?.paused && (
                <p className="flex items-center gap-2 rounded-lg bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-200">
                    <PauseCircle className="size-4" />
                    Online bookings are paused: an invoice is past the grace
                    period.
                </p>
            )}
            {subscription?.plan_id && (
                <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                    <div className="flex gap-2">
                        <dt className="text-muted-foreground">Billed</dt>
                        <dd className="capitalize">
                            {subscription.billing_cycle}
                        </dd>
                    </div>
                    {subscription.paid_through && (
                        <div className="flex gap-2">
                            <dt className="text-muted-foreground">
                                Invoiced through
                            </dt>
                            <dd>
                                {format(
                                    parseISO(subscription.paid_through),
                                    'MMM d, yyyy',
                                )}
                            </dd>
                        </div>
                    )}
                    {subscription.ends_on && (
                        <div className="flex gap-2 text-amber-700 dark:text-amber-400">
                            <dt>Cancelled, ends</dt>
                            <dd>
                                {format(
                                    parseISO(subscription.ends_on),
                                    'MMM d, yyyy',
                                )}
                            </dd>
                        </div>
                    )}
                    {subscription.pending_plan && (
                        <div className="flex gap-2">
                            <dt className="text-muted-foreground">
                                Next period
                            </dt>
                            <dd>{subscription.pending_plan}</dd>
                        </div>
                    )}
                </dl>
            )}
            <form
                onSubmit={submit}
                className="flex flex-col gap-3 sm:flex-row sm:items-end"
            >
                <label className="space-y-1.5 text-sm">
                    <span className="font-medium">Plan</span>
                    <OptionSelect
                        options={plans.map((plan) => ({
                            value: String(plan.id),
                            label: `${plan.name} · ${formatPeso(plan.price)}`,
                        }))}
                        value={form.data.plan_id || null}
                        onChange={(value) =>
                            form.setData('plan_id', value ?? '')
                        }
                        anyLabel="No plan"
                        placeholder="No plan"
                        className="w-56"
                    />
                </label>
                <Button
                    type="submit"
                    variant="secondary"
                    disabled={form.processing || !form.isDirty}
                >
                    Save
                </Button>
            </form>
            {invoices.length > 0 ? (
                <ul className="divide-y rounded-lg border text-sm">
                    {invoices.map((invoice) => (
                        <li
                            key={invoice.id}
                            className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
                        >
                            <span>
                                <span className="font-mono text-xs">
                                    {invoice.number}
                                </span>{' '}
                                <span className="text-muted-foreground">
                                    {invoice.plan_name} ·{' '}
                                    {format(
                                        parseISO(invoice.period_start),
                                        'MMM yyyy',
                                    )}
                                </span>
                            </span>
                            <span className="flex items-center gap-3">
                                <span className="tabular-nums">
                                    {formatPeso(invoice.amount)}
                                </span>
                                <span
                                    className={cn(
                                        'text-xs capitalize',
                                        invoice.is_overdue
                                            ? 'font-medium text-destructive'
                                            : 'text-muted-foreground',
                                    )}
                                >
                                    {invoice.is_overdue
                                        ? 'Overdue'
                                        : invoice.status}
                                </span>
                            </span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-muted-foreground">
                    No invoices yet.
                </p>
            )}
        </div>
    );
}
