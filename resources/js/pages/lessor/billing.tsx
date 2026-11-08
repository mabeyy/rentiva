import { Head, router, useForm } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { Check, CreditCard, Landmark, Minus, Receipt } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { EmptyState } from '@/components/empty-state';
import type {
    BillingCycle,
    PublicPlan,
} from '@/components/landing/pricing-section';
import {
    CycleToggle,
    newFeatures,
    planLimits,
    PlanPrice,
} from '@/components/landing/pricing-section';
import { FormField } from '@/components/form-field';
import InputError from '@/components/input-error';
import { PageHeader } from '@/components/lessor/page-header';
import { BrandButton } from '@/components/public/brand-button';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { formatPeso } from '@/lib/format';
import { cn } from '@/lib/utils';
import lessor from '@/routes/lessor';

type Plan = PublicPlan;

type Invoice = {
    id: number;
    number: string;
    plan_name: string;
    amount: number;
    status: 'unpaid' | 'submitted' | 'paid' | 'rejected';
    payment_reference: string | null;
    rejection_reason: string | null;
    period_start: string;
    period_end: string;
    due_on: string;
    is_overdue: boolean;
    paid_at: string | null;
};

type BankAccount = {
    bank_name: string;
    account_name: string;
    account_number: string;
};

const statusStyles: Record<Invoice['status'], { label: string; tone: string }> =
    {
        unpaid: { label: 'Unpaid', tone: 'bg-muted text-foreground' },
        submitted: {
            label: 'Checking',
            tone: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
        },
        paid: {
            label: 'Paid',
            tone: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
        },
        rejected: {
            label: 'Send again',
            tone: 'bg-destructive/10 text-destructive',
        },
    };

function short(date: string): string {
    return format(parseISO(date), 'MMM d, yyyy');
}

function PayDialog({
    invoice,
    accounts,
    onClose,
}: {
    invoice: Invoice;
    accounts: BankAccount[];
    onClose: () => void;
}) {
    const form = useForm<{ payment_reference: string; proof: File | null }>({
        payment_reference: '',
        proof: null,
    });

    function submit(event: FormEvent): void {
        event.preventDefault();
        form.post(lessor.billing.invoices.pay(invoice.id).url, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: onClose,
        });
    }

    return (
        <form onSubmit={submit} className="space-y-4">
            <DialogHeader>
                <DialogTitle>Pay {invoice.number}</DialogTitle>
                <DialogDescription>
                    Transfer the amount to one of these accounts, then add the
                    reference number and a screenshot.
                </DialogDescription>
            </DialogHeader>

            <div className="flex items-center justify-between rounded-2xl bg-brand/5 px-4 py-3">
                <span className="text-sm text-muted-foreground">
                    Amount to send
                </span>
                <span className="font-display text-2xl font-extrabold text-brand tabular-nums">
                    {formatPeso(invoice.amount)}
                </span>
            </div>

            {accounts.length > 0 ? (
                <ul className="space-y-2">
                    {accounts.map((account) => (
                        <li
                            key={account.account_number}
                            className="flex items-center gap-3 rounded-2xl border p-3 text-sm"
                        >
                            <Landmark className="size-4 shrink-0 text-brand" />
                            <div>
                                <p className="font-medium">
                                    {account.bank_name}
                                </p>
                                <p className="text-muted-foreground">
                                    {account.account_name} ·{' '}
                                    <span className="font-mono text-foreground">
                                        {account.account_number}
                                    </span>
                                </p>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="rounded-2xl border border-dashed p-3 text-sm text-muted-foreground">
                    Payment details aren't set up yet. Contact Rentiva support.
                </p>
            )}

            <FormField
                id="payment_reference"
                label="Reference number"
                error={form.errors.payment_reference}
            >
                <Input
                    id="payment_reference"
                    value={form.data.payment_reference}
                    onChange={(event) =>
                        form.setData('payment_reference', event.target.value)
                    }
                    required
                />
            </FormField>
            <FormField
                id="proof"
                label="Screenshot of the transfer"
                error={form.errors.proof}
            >
                <Input
                    id="proof"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) =>
                        form.setData('proof', event.target.files?.[0] ?? null)
                    }
                    required
                />
            </FormField>
            <DialogFooter>
                <Button type="submit" disabled={form.processing}>
                    {form.processing && <Spinner />}
                    Send payment
                </Button>
            </DialogFooter>
        </form>
    );
}

export default function LessorBilling({
    subscription,
    plans,
    usage,
    invoices,
    bankAccounts,
}: {
    subscription: {
        plan_id: number | null;
        billing_cycle: BillingCycle;
        next_invoice_on: string | null;
    };
    plans: Plan[];
    usage: { cars: number; staff: number };
    invoices: Invoice[];
    bankAccounts: BankAccount[];
}) {
    const [paying, setPaying] = useState<Invoice | null>(null);
    const [choosing, setChoosing] = useState<number | null>(null);
    const [cycle, setCycle] = useState<BillingCycle>(
        subscription.billing_cycle,
    );
    const [planError, setPlanError] = useState<string | null>(null);
    const current = plans.find((plan) => plan.id === subscription.plan_id);

    function choose(plan: Plan): void {
        setChoosing(plan.id);
        setPlanError(null);
        router.put(
            lessor.billing.update().url,
            { plan_id: plan.id, billing_cycle: cycle },
            {
                preserveScroll: true,
                onError: (errors) => setPlanError(errors.plan_id ?? null),
                onFinish: () => setChoosing(null),
            },
        );
    }

    return (
        <>
            <Head title="Billing" />

            <div className="mx-auto w-full max-w-5xl space-y-8 p-4 md:p-8">
                <PageHeader
                    eyebrow="Your business"
                    title="Billing"
                    description="Your Rentiva plan and invoices. Pay by bank transfer each month."
                />

                <section className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border bg-background p-5">
                    <div className="flex items-center gap-3">
                        <span className="flex size-10 items-center justify-center rounded-full bg-brand/10 text-brand">
                            <CreditCard className="size-5" />
                        </span>
                        <div>
                            <p className="font-semibold">
                                {current
                                    ? `${current.name} plan`
                                    : 'No plan yet'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {current
                                    ? `${formatPeso(current.price)} a month.`
                                    : 'Pick a plan below. Your first invoice comes right away.'}
                                {subscription.next_invoice_on &&
                                    ` Next invoice ${short(subscription.next_invoice_on)}.`}
                            </p>
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground tabular-nums">
                        {usage.cars} {usage.cars === 1 ? 'car' : 'cars'} ·{' '}
                        {usage.staff} staff
                    </p>
                </section>

                <section className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 className="font-display text-xl font-bold tracking-tight">
                            Plans
                        </h2>
                        <CycleToggle cycle={cycle} onChange={setCycle} />
                    </div>
                    <InputError message={planError ?? undefined} />
                    <div className="grid gap-4 md:grid-cols-3">
                        {plans.map((plan, index) => {
                            const isCurrent =
                                plan.id === subscription.plan_id &&
                                cycle === subscription.billing_cycle;
                            const previous = plans[index - 1];

                            return (
                                <div
                                    key={plan.id}
                                    className={cn(
                                        'flex flex-col rounded-3xl border bg-background p-5',
                                        isCurrent &&
                                            'border-brand ring-1 ring-brand',
                                    )}
                                >
                                    <p className="font-semibold">{plan.name}</p>
                                    <div className="mt-2 [&_.text-5xl]:text-3xl">
                                        <PlanPrice plan={plan} cycle={cycle} />
                                    </div>
                                    <ul className="mt-4 flex-1 space-y-1.5 text-sm">
                                        {planLimits(plan).map((line) => (
                                            <li
                                                key={line}
                                                className="flex items-center gap-2 font-medium"
                                            >
                                                <Check className="size-4 text-brand" />
                                                {line}
                                            </li>
                                        ))}
                                        {previous && (
                                            <li className="pt-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                                Everything in {previous.name},
                                                plus
                                            </li>
                                        )}
                                        {newFeatures(plan, previous).map(
                                            (label) => (
                                                <li
                                                    key={label}
                                                    className="flex items-center gap-2"
                                                >
                                                    <Check className="size-4 text-brand" />
                                                    {label}
                                                </li>
                                            ),
                                        )}
                                    </ul>
                                    {isCurrent ? (
                                        <p className="mt-5 text-center text-sm font-medium text-brand">
                                            Your plan
                                        </p>
                                    ) : (
                                        <BrandButton
                                            className="mt-5 rounded-full"
                                            disabled={choosing !== null}
                                            onClick={() => choose(plan)}
                                        >
                                            {choosing === plan.id && (
                                                <Spinner />
                                            )}
                                            {plan.id === subscription.plan_id
                                                ? `Switch to ${cycle}`
                                                : `${current ? 'Switch to' : 'Choose'} ${plan.name}`}
                                        </BrandButton>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    {current && (
                        <p className="text-xs text-muted-foreground">
                            Switching changes the price from your next invoice.
                        </p>
                    )}
                </section>

                <section className="space-y-3">
                    <h2 className="font-display text-xl font-bold tracking-tight">
                        Invoices
                    </h2>
                    {invoices.length > 0 ? (
                        <ul className="divide-y rounded-3xl border bg-background">
                            {invoices.map((invoice) => {
                                const style = statusStyles[invoice.status];
                                const canPay = ['unpaid', 'rejected'].includes(
                                    invoice.status,
                                );

                                return (
                                    <li
                                        key={invoice.id}
                                        className="flex flex-wrap items-center gap-4 px-5 py-4"
                                    >
                                        <Receipt className="size-5 text-muted-foreground" />
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium">
                                                {invoice.plan_name} ·{' '}
                                                {short(invoice.period_start)} –{' '}
                                                {short(invoice.period_end)}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                <span className="font-mono">
                                                    {invoice.number}
                                                </span>
                                                {canPay &&
                                                    ` · due ${short(invoice.due_on)}`}
                                                {invoice.is_overdue && (
                                                    <span className="font-medium text-destructive">
                                                        {' '}
                                                        · overdue
                                                    </span>
                                                )}
                                            </p>
                                            {invoice.status === 'rejected' &&
                                                invoice.rejection_reason && (
                                                    <p className="mt-1 text-xs text-destructive">
                                                        {
                                                            invoice.rejection_reason
                                                        }
                                                    </p>
                                                )}
                                        </div>
                                        <span className="font-semibold tabular-nums">
                                            {formatPeso(invoice.amount)}
                                        </span>
                                        <span
                                            className={cn(
                                                'rounded-full px-2.5 py-0.5 text-xs font-medium',
                                                style.tone,
                                            )}
                                        >
                                            {style.label}
                                        </span>
                                        {canPay && (
                                            <BrandButton
                                                size="sm"
                                                className="rounded-full"
                                                onClick={() =>
                                                    setPaying(invoice)
                                                }
                                            >
                                                Pay
                                            </BrandButton>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <EmptyState
                            icon={Receipt}
                            title="No invoices yet"
                            description={
                                current
                                    ? 'Your invoices will show up here.'
                                    : 'Pick a plan above to get your first invoice.'
                            }
                        />
                    )}
                </section>
            </div>

            <Dialog
                open={paying !== null}
                onOpenChange={(isOpen) => !isOpen && setPaying(null)}
            >
                <DialogContent className="sm:max-w-md">
                    {paying && (
                        <PayDialog
                            invoice={paying}
                            accounts={bankAccounts}
                            onClose={() => setPaying(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

LessorBilling.layout = {
    breadcrumbs: [{ title: 'Billing', href: lessor.billing.index() }],
};
