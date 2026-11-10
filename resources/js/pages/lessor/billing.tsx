import { Head, router, useForm } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import {
    AlertTriangle,
    CalendarClock,
    CarFront,
    Check,
    Copy,
    FileText,
    ImageUp,
    Send,
    Infinity as InfinityIcon,
    Sparkles,
    Users,
    Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { TransferAccountCard } from '@/components/bookings/transfer-account-card';
import { ConfirmDialog } from '@/components/confirm-dialog';
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
import { FormSection } from '@/components/lessor/form-section';
import { PageHeader } from '@/components/lessor/page-header';
import { SectionNav } from '@/components/lessor/section-nav';
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useClipboard } from '@/hooks/use-clipboard';
import { formatPeso } from '@/lib/format';
import { cn } from '@/lib/utils';
import lessor from '@/routes/lessor';

type Plan = PublicPlan;

type Invoice = {
    id: number;
    number: string;
    plan_name: string;
    amount: number;
    status: 'unpaid' | 'submitted' | 'paid' | 'rejected' | 'cancelled';
    payment_reference: string | null;
    rejection_reason: string | null;
    cancel_reason: string | null;
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
    qr_url: string | null;
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
        cancelled: {
            label: 'Cancelled',
            tone: 'bg-muted text-muted-foreground line-through',
        },
    };

function short(date: string): string {
    return format(parseISO(date), 'MMM d, yyyy');
}

/** A step heading inside the pay dialog. */
function PayStep({ title }: { title: string }) {
    return <p className="text-sm font-semibold">{title}</p>;
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
    const [accountIndex, setAccountIndex] = useState(0);
    const [proofPreview, setProofPreview] = useState<string | null>(null);
    const [copiedText, copy] = useClipboard();
    const amountText = (invoice.amount / 100).toFixed(2);
    const account = accounts[accountIndex];

    // Free the previewed screenshot's memory when it changes or closes.
    useEffect(
        () => () => {
            if (proofPreview) {
                URL.revokeObjectURL(proofPreview);
            }
        },
        [proofPreview],
    );

    function submit(event: FormEvent): void {
        event.preventDefault();
        form.post(lessor.billing.invoices.pay(invoice.id).url, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: onClose,
        });
    }

    return (
        <form onSubmit={submit} className="space-y-5">
            <DialogHeader>
                <DialogTitle>Pay your invoice</DialogTitle>
                <DialogDescription>
                    <span className="font-mono">{invoice.number}</span> ·{' '}
                    {invoice.plan_name} plan, {short(invoice.period_start)} –{' '}
                    {short(invoice.period_end)}
                </DialogDescription>
            </DialogHeader>

            <div className="flex items-center justify-between gap-3 rounded-2xl border px-4 py-3">
                <div>
                    <p className="font-display text-2xl font-extrabold tabular-nums">
                        {formatPeso(invoice.amount)}
                    </p>
                    <p
                        className={cn(
                            'text-xs text-muted-foreground',
                            invoice.is_overdue &&
                                'font-medium text-destructive',
                        )}
                    >
                        {invoice.is_overdue
                            ? `Overdue since ${short(invoice.due_on)}`
                            : `Due ${short(invoice.due_on)}`}
                    </p>
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="rounded-full text-muted-foreground"
                    onClick={() => copy(amountText)}
                >
                    {copiedText === amountText ? (
                        <Check className="text-brand" />
                    ) : (
                        <Copy />
                    )}
                    {copiedText === amountText ? 'Copied' : 'Copy amount'}
                </Button>
            </div>

            {invoice.status === 'rejected' && (
                <p className="flex gap-2 rounded-2xl bg-destructive/5 p-3 text-sm text-destructive">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                    <span>
                        We couldn't confirm your last payment
                        {invoice.rejection_reason
                            ? `: ${invoice.rejection_reason}`
                            : '.'}{' '}
                        Please send it again.
                    </span>
                </p>
            )}

            <div className="space-y-3">
                <PayStep title="Send it to Rentiva" />
                {account ? (
                    <>
                        {accounts.length > 1 && (
                            <div
                                role="radiogroup"
                                aria-label="Account"
                                className="flex flex-wrap gap-1.5"
                            >
                                {accounts.map((option, index) => (
                                    <button
                                        key={option.account_number}
                                        type="button"
                                        role="radio"
                                        aria-checked={index === accountIndex}
                                        onClick={() => setAccountIndex(index)}
                                        className={cn(
                                            'rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:border-foreground/30',
                                            index === accountIndex &&
                                                'border-brand bg-brand/5 text-brand hover:border-brand',
                                        )}
                                    >
                                        {option.bank_name}
                                    </button>
                                ))}
                            </div>
                        )}
                        <TransferAccountCard account={account} compact />
                    </>
                ) : (
                    <p className="rounded-2xl border border-dashed p-3 text-sm text-muted-foreground">
                        Payment details aren't set up yet. Contact Rentiva
                        support.
                    </p>
                )}
            </div>

            <div className="space-y-3">
                <PayStep title="Tell us you've paid" />
                <FormField
                    id="payment_reference"
                    label="Reference number"
                    error={form.errors.payment_reference}
                >
                    <Input
                        id="payment_reference"
                        value={form.data.payment_reference}
                        onChange={(event) =>
                            form.setData(
                                'payment_reference',
                                event.target.value,
                            )
                        }
                        placeholder="From your bank or e-wallet receipt"
                        autoComplete="off"
                        required
                    />
                </FormField>
                <FormField
                    id="proof"
                    label="Screenshot of the transfer"
                    error={form.errors.proof}
                >
                    <label
                        htmlFor="proof"
                        className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed p-2.5 text-sm transition-colors focus-within:ring-[3px] focus-within:ring-ring/50 hover:border-foreground/30"
                    >
                        {proofPreview ? (
                            <img
                                src={proofPreview}
                                alt="Transfer screenshot preview"
                                className="size-11 shrink-0 rounded-lg border bg-muted object-cover"
                            />
                        ) : (
                            <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                <ImageUp className="size-5" />
                            </span>
                        )}
                        <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">
                                {form.data.proof?.name ?? 'Add the screenshot'}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                                {form.data.proof
                                    ? 'Click to choose another'
                                    : 'From your banking app'}
                            </span>
                        </span>
                        <input
                            id="proof"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="sr-only"
                            onChange={(event) => {
                                const file = event.target.files?.[0] ?? null;
                                form.setData('proof', file);
                                setProofPreview(
                                    file ? URL.createObjectURL(file) : null,
                                );
                            }}
                            required
                        />
                    </label>
                </FormField>
            </div>

            <DialogFooter>
                <Button type="button" variant="ghost" onClick={onClose}>
                    Cancel
                </Button>
                <BrandButton
                    type="submit"
                    disabled={
                        form.processing ||
                        accounts.length === 0 ||
                        !form.data.payment_reference.trim() ||
                        !form.data.proof
                    }
                >
                    {form.processing ? <Spinner /> : <Send />}
                    Send payment
                </BrandButton>
            </DialogFooter>
        </form>
    );
}

const billingSections = [
    { id: 'plan', label: 'Your plan' },
    { id: 'invoices', label: 'Invoices' },
    { id: 'plans', label: 'Plans' },
];

/** How much of a plan limit is used, e.g. "3 cars · 2 left of 5", with a bar. */
function UsageTile({
    icon: Icon,
    unit,
    used,
    limit,
}: {
    icon: LucideIcon;
    /** Plural noun for the count, e.g. "cars". */
    unit: string;
    used: number;
    limit: number | null;
}) {
    const isAtLimit = limit !== null && limit > 0 && used >= limit;

    return (
        <div className="rounded-2xl border p-4">
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Icon className="size-4" />
                <span className="capitalize">{unit}</span>
            </p>
            <p className="mt-1 font-display text-2xl font-bold tabular-nums">
                {used}
                {limit !== null && limit > 0 && (
                    <span className="text-base font-medium text-muted-foreground">
                        {' '}
                        / {limit}
                    </span>
                )}
            </p>
            {limit === null ? (
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <InfinityIcon className="size-3.5" /> Unlimited on your plan
                </p>
            ) : limit === 0 ? (
                <p className="mt-1 text-xs text-muted-foreground">
                    Not included on your plan
                </p>
            ) : (
                <>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                        <span
                            className={cn(
                                'block h-full rounded-full',
                                isAtLimit ? 'bg-destructive' : 'bg-brand',
                            )}
                            style={{
                                width: `${Math.min(100, (used / limit) * 100)}%`,
                            }}
                        />
                    </div>
                    <p
                        className={cn(
                            'mt-1.5 text-xs text-muted-foreground',
                            isAtLimit && 'font-medium text-destructive',
                        )}
                    >
                        {isAtLimit ? 'At your limit' : `${limit - used} left`}
                    </p>
                </>
            )}
        </div>
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
        /** The last day already invoiced. */
        period_end: string | null;
        /** The last day of a cancelled plan; null while it carries on. */
        ends_on: string | null;
        /** A smaller plan or cycle switch that starts with the next period. */
        pending: {
            plan_name: string;
            billing_cycle: BillingCycle;
            starts_on: string;
        } | null;
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

    const payable = invoices.filter((invoice) =>
        ['unpaid', 'rejected'].includes(invoice.status),
    );
    const nextDue = [...payable].sort((a, b) =>
        a.due_on.localeCompare(b.due_on),
    )[0];
    const totalDue = payable.reduce((sum, invoice) => sum + invoice.amount, 0);

    return (
        <>
            <Head title="Billing" />

            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8">
                <PageHeader
                    title="Billing"
                    description="Your Rentiva plan, what you use of it, and your invoices. You pay each invoice by bank transfer."
                />

                {nextDue && (
                    <section
                        className={cn(
                            'flex flex-wrap items-center gap-4 rounded-3xl border p-5',
                            nextDue.is_overdue
                                ? 'border-destructive/40 bg-destructive/5'
                                : 'border-brand/40 bg-brand/5',
                        )}
                    >
                        <span
                            className={cn(
                                'flex size-11 shrink-0 items-center justify-center rounded-2xl text-white',
                                nextDue.is_overdue
                                    ? 'bg-destructive'
                                    : 'bg-brand',
                            )}
                        >
                            {nextDue.is_overdue ? (
                                <AlertTriangle className="size-5" />
                            ) : (
                                <Wallet className="size-5" />
                            )}
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="font-semibold">
                                {formatPeso(totalDue)}{' '}
                                {nextDue.is_overdue
                                    ? `overdue since ${short(nextDue.due_on)}`
                                    : `due ${short(nextDue.due_on)}`}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {nextDue.status === 'rejected'
                                    ? `We couldn't confirm your last payment${nextDue.rejection_reason ? `: ${nextDue.rejection_reason}` : '.'} Please send it again.`
                                    : payable.length > 1
                                      ? `${payable.length} invoices to pay.`
                                      : `${nextDue.plan_name} plan, ${short(nextDue.period_start)} – ${short(nextDue.period_end)}.`}
                            </p>
                        </div>
                        <BrandButton
                            className="rounded-full px-5"
                            onClick={() => setPaying(nextDue)}
                        >
                            Pay {formatPeso(nextDue.amount)}
                        </BrandButton>
                    </section>
                )}

                <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
                    <div className="space-y-6">
                        <FormSection
                            id="plan"
                            title="Your plan"
                            description={
                                current
                                    ? 'What you pay, when, and how much of your plan you use.'
                                    : 'Pick a plan below. Your first invoice comes right away.'
                            }
                        >
                            {subscription.pending && current && (
                                <p className="mb-4 flex flex-wrap items-start gap-2 rounded-2xl bg-sky-500/10 p-3 text-sm text-sky-800 dark:text-sky-300">
                                    <CalendarClock className="mt-0.5 size-4 shrink-0" />
                                    <span className="flex-1">
                                        From{' '}
                                        <strong>
                                            {short(
                                                subscription.pending.starts_on,
                                            )}
                                        </strong>
                                        , you'll be on{' '}
                                        <strong>
                                            {subscription.pending.plan_name}
                                        </strong>{' '}
                                        ({subscription.pending.billing_cycle}).
                                        Until then you keep {current.name}.
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            router.put(
                                                lessor.billing.update().url,
                                                {
                                                    plan_id: current.id,
                                                    billing_cycle:
                                                        subscription.billing_cycle,
                                                },
                                                {
                                                    preserveScroll: true,
                                                    onError: (errors) =>
                                                        toast.error(
                                                            errors.plan_id ??
                                                                "Couldn't keep your plan. Please try again.",
                                                        ),
                                                },
                                            )
                                        }
                                        className="font-medium underline-offset-4 hover:underline"
                                    >
                                        Keep {current.name}
                                    </button>
                                </p>
                            )}
                            {subscription.ends_on && current && (
                                <p className="mb-4 flex items-start gap-2 rounded-2xl bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-300">
                                    <CalendarClock className="mt-0.5 size-4 shrink-0" />
                                    <span>
                                        Your {current.name} plan ends on{' '}
                                        <strong>
                                            {short(subscription.ends_on)}
                                        </strong>
                                        . You won't be invoiced again. After
                                        that, your booking page keeps working
                                        but plan features switch off until you
                                        pick a plan.
                                    </span>
                                </p>
                            )}
                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                <div className="flex flex-col rounded-2xl border border-brand/40 bg-brand/5 p-4">
                                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                        <Sparkles className="size-4 text-brand" />
                                        Plan
                                    </p>
                                    <p className="mt-1 font-display text-2xl font-bold">
                                        {current?.name ?? 'None yet'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {current
                                            ? subscription.billing_cycle ===
                                              'yearly'
                                                ? `${formatPeso(current.yearly_price)} a year`
                                                : `${formatPeso(current.price)} a month`
                                            : 'Choose one to start'}
                                    </p>
                                    <a
                                        href="#plans"
                                        onClick={(event) => {
                                            event.preventDefault();
                                            document
                                                .getElementById('plans')
                                                ?.scrollIntoView({
                                                    behavior: 'smooth',
                                                });
                                        }}
                                        className="mt-auto pt-2 text-xs font-medium text-brand underline-offset-4 hover:underline"
                                    >
                                        {current ? 'Change plan' : 'See plans'}
                                    </a>
                                    {current &&
                                        (subscription.ends_on ? (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    router.post(
                                                        lessor.billing.resume()
                                                            .url,
                                                        {},
                                                        {
                                                            preserveScroll: true,
                                                        },
                                                    )
                                                }
                                                className="mt-1 w-fit text-xs font-medium text-foreground underline-offset-4 hover:underline"
                                            >
                                                Keep my plan
                                            </button>
                                        ) : (
                                            <ConfirmDialog
                                                trigger={
                                                    <button
                                                        type="button"
                                                        className="mt-1 w-fit text-xs text-muted-foreground underline-offset-4 hover:text-destructive hover:underline"
                                                    >
                                                        Cancel plan
                                                    </button>
                                                }
                                                title={`Cancel your ${current.name} plan?`}
                                                description={`It stays on until ${subscription.period_end ? short(subscription.period_end) : 'the end of the period you’ve been invoiced for'}, and you won't be invoiced again. Unpaid invoices are still due. You can keep your plan any time before it ends.`}
                                                confirmLabel="Cancel plan"
                                                onConfirm={() =>
                                                    router.delete(
                                                        lessor.billing.cancel()
                                                            .url,
                                                        {
                                                            preserveScroll: true,
                                                        },
                                                    )
                                                }
                                            />
                                        ))}
                                </div>
                                <div className="rounded-2xl border p-4">
                                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                        <CalendarClock className="size-4" />
                                        {subscription.ends_on
                                            ? 'Plan ends'
                                            : 'Next invoice'}
                                    </p>
                                    <p className="mt-1 font-display text-2xl font-bold">
                                        {subscription.ends_on
                                            ? format(
                                                  parseISO(
                                                      subscription.ends_on,
                                                  ),
                                                  'MMM d',
                                              )
                                            : subscription.next_invoice_on
                                              ? format(
                                                    parseISO(
                                                        subscription.next_invoice_on,
                                                    ),
                                                    'MMM d',
                                                )
                                              : '–'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {subscription.ends_on
                                            ? `${format(parseISO(subscription.ends_on), 'yyyy')} · no more invoices`
                                            : subscription.next_invoice_on
                                              ? format(
                                                    parseISO(
                                                        subscription.next_invoice_on,
                                                    ),
                                                    'yyyy',
                                                ) +
                                                (current
                                                    ? ` · ${formatPeso(subscription.billing_cycle === 'yearly' ? current.yearly_price : current.price)}`
                                                    : '')
                                              : 'Comes once you pick a plan'}
                                    </p>
                                </div>
                                <UsageTile
                                    icon={CarFront}
                                    unit="cars"
                                    used={usage.cars}
                                    limit={current?.max_cars ?? null}
                                />
                                <UsageTile
                                    icon={Users}
                                    unit="staff"
                                    used={usage.staff}
                                    limit={current?.max_staff ?? null}
                                />
                            </div>
                        </FormSection>

                        <FormSection
                            id="invoices"
                            title="Invoices"
                            description="Every invoice, newest first. Pay any that are unpaid or need sending again."
                        >
                            {invoices.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Invoice</TableHead>
                                            <TableHead>Period</TableHead>
                                            <TableHead>Due</TableHead>
                                            <TableHead className="text-right">
                                                Amount
                                            </TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>
                                                <span className="sr-only">
                                                    Actions
                                                </span>
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {invoices.map((invoice) => {
                                            const style =
                                                statusStyles[invoice.status];
                                            const canPay = [
                                                'unpaid',
                                                'rejected',
                                            ].includes(invoice.status);

                                            return (
                                                <TableRow key={invoice.id}>
                                                    <TableCell>
                                                        <p className="font-mono text-sm">
                                                            {invoice.number}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {invoice.plan_name}
                                                        </p>
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap text-muted-foreground">
                                                        {short(
                                                            invoice.period_start,
                                                        )}{' '}
                                                        –{' '}
                                                        {short(
                                                            invoice.period_end,
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap">
                                                        {invoice.status ===
                                                        'paid' ? (
                                                            <span className="text-muted-foreground">
                                                                Paid{' '}
                                                                {invoice.paid_at &&
                                                                    short(
                                                                        invoice.paid_at,
                                                                    )}
                                                            </span>
                                                        ) : (
                                                            <span
                                                                className={cn(
                                                                    invoice.is_overdue &&
                                                                        'font-medium text-destructive',
                                                                )}
                                                            >
                                                                {short(
                                                                    invoice.due_on,
                                                                )}
                                                                {invoice.is_overdue &&
                                                                    ' · overdue'}
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right font-semibold tabular-nums">
                                                        {formatPeso(
                                                            invoice.amount,
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span
                                                            className={cn(
                                                                'rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
                                                                style.tone,
                                                            )}
                                                        >
                                                            {style.label}
                                                        </span>
                                                        {invoice.status ===
                                                            'rejected' &&
                                                            invoice.rejection_reason && (
                                                                <p className="mt-1 max-w-48 text-xs text-destructive">
                                                                    {
                                                                        invoice.rejection_reason
                                                                    }
                                                                </p>
                                                            )}
                                                        {invoice.status ===
                                                            'cancelled' &&
                                                            invoice.cancel_reason && (
                                                                <p className="mt-1 max-w-48 text-xs text-muted-foreground">
                                                                    {
                                                                        invoice.cancel_reason
                                                                    }
                                                                </p>
                                                            )}
                                                    </TableCell>
                                                    <TableCell className="text-right whitespace-nowrap">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="mr-1 text-muted-foreground"
                                                            tooltip={
                                                                invoice.status ===
                                                                'paid'
                                                                    ? 'Open receipt'
                                                                    : 'Open invoice'
                                                            }
                                                            asChild
                                                        >
                                                            <a
                                                                href={
                                                                    lessor.billing.invoices.show(
                                                                        invoice.id,
                                                                    ).url
                                                                }
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                <FileText />
                                                            </a>
                                                        </Button>
                                                        {canPay && (
                                                            <BrandButton
                                                                size="sm"
                                                                className="rounded-full"
                                                                onClick={() =>
                                                                    setPaying(
                                                                        invoice,
                                                                    )
                                                                }
                                                            >
                                                                Pay
                                                            </BrandButton>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            ) : (
                                <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                                    {current
                                        ? 'No invoices yet. They show up here when they come.'
                                        : 'Pick a plan below to get your first invoice.'}
                                </p>
                            )}
                        </FormSection>

                        <FormSection
                            id="plans"
                            title={current ? 'Change plan' : 'Choose a plan'}
                            description={
                                current
                                    ? 'A bigger plan starts now; you pay the difference for the rest of this period. A smaller plan, or switching between monthly and yearly, starts with your next period.'
                                    : 'Every plan has no commission and unlimited bookings.'
                            }
                        >
                            <div className="mb-4 flex justify-end">
                                <CycleToggle
                                    cycle={cycle}
                                    onChange={setCycle}
                                />
                            </div>
                            <InputError
                                message={planError ?? undefined}
                                className="mb-3"
                            />
                            <div className="grid gap-4 xl:grid-cols-3">
                                {plans.map((plan, index) => {
                                    const isCurrent =
                                        plan.id === subscription.plan_id &&
                                        cycle === subscription.billing_cycle;
                                    const previous = plans[index - 1];

                                    return (
                                        <div
                                            key={plan.id}
                                            className={cn(
                                                'relative flex flex-col rounded-2xl border p-5',
                                                isCurrent &&
                                                    'border-brand bg-brand/5',
                                            )}
                                        >
                                            {isCurrent && (
                                                <span className="absolute -top-2.5 left-5 rounded-full bg-brand px-2.5 py-0.5 text-xs font-semibold text-brand-foreground">
                                                    Your plan
                                                </span>
                                            )}
                                            <p className="font-semibold">
                                                {plan.name}
                                            </p>
                                            <div className="mt-2 [&_.text-5xl]:text-3xl">
                                                <PlanPrice
                                                    plan={plan}
                                                    cycle={cycle}
                                                />
                                            </div>
                                            <ul className="mt-4 flex-1 space-y-1.5 text-sm">
                                                {planLimits(plan).map(
                                                    (line) => (
                                                        <li
                                                            key={line}
                                                            className="flex items-center gap-2 font-medium"
                                                        >
                                                            <Check className="size-4 shrink-0 text-brand" />
                                                            {line}
                                                        </li>
                                                    ),
                                                )}
                                                {previous && (
                                                    <li className="pt-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                                        Everything in{' '}
                                                        {previous.name}, plus
                                                    </li>
                                                )}
                                                {newFeatures(
                                                    plan,
                                                    previous,
                                                ).map((label) => (
                                                    <li
                                                        key={label}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <Check className="size-4 shrink-0 text-brand" />
                                                        {label}
                                                    </li>
                                                ))}
                                            </ul>
                                            {isCurrent ? (
                                                <p className="mt-5 flex h-9 items-center justify-center text-sm font-medium text-brand">
                                                    Current plan
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
                                                    {plan.id ===
                                                    subscription.plan_id
                                                        ? `Switch to ${cycle}`
                                                        : `${current ? 'Switch to' : 'Choose'} ${plan.name}`}
                                                </BrandButton>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </FormSection>
                    </div>

                    <SectionNav sections={billingSections} />
                </div>
            </div>

            <Dialog
                open={paying !== null}
                onOpenChange={(isOpen) => !isOpen && setPaying(null)}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
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
