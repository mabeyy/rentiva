import { Head, router, useForm } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { Plus, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { PaginationLinks } from '@/components/pagination-links';
import { StatusTabs } from '@/components/status-tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useQueryFilters } from '@/hooks/use-query-filters';
import { formatPeso } from '@/lib/format';
import admin from '@/routes/admin';
import type { Paginated } from '@/types';

type AdminInvoice = {
    id: number;
    number: string;
    owner: string;
    plan_name: string;
    amount: number;
    status: 'unpaid' | 'submitted' | 'paid' | 'rejected';
    payment_reference: string | null;
    rejection_reason: string | null;
    period_start: string;
    period_end: string;
    due_on: string;
    is_overdue: boolean;
    has_proof: boolean;
};

type BankAccount = {
    bank_name: string;
    account_name: string;
    account_number: string;
};

const statusLabels: Record<AdminInvoice['status'], string> = {
    unpaid: 'Unpaid',
    submitted: 'To check',
    paid: 'Paid',
    rejected: 'Sent back',
};

function AccountsForm({ accounts }: { accounts: BankAccount[] }) {
    const form = useForm<{ accounts: BankAccount[] }>({ accounts });

    function submit(event: FormEvent): void {
        event.preventDefault();
        form.put(admin.billing.accounts.update().url, { preserveScroll: true });
    }

    function setAccount(
        index: number,
        key: keyof BankAccount,
        value: string,
    ): void {
        form.setData(
            'accounts',
            form.data.accounts.map((account, current) =>
                current === index ? { ...account, [key]: value } : account,
            ),
        );
    }

    return (
        <form onSubmit={submit} className="space-y-3 rounded-xl border p-4">
            <div>
                <p className="font-medium">Where owners pay</p>
                <p className="text-sm text-muted-foreground">
                    Shown on every owner's invoice. Up to three accounts.
                </p>
            </div>
            {form.data.accounts.map((account, index) => (
                <div
                    key={index}
                    className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]"
                >
                    <Input
                        aria-label="Bank or e-wallet"
                        placeholder="Bank or e-wallet"
                        value={account.bank_name}
                        onChange={(event) =>
                            setAccount(index, 'bank_name', event.target.value)
                        }
                    />
                    <Input
                        aria-label="Account name"
                        placeholder="Account name"
                        value={account.account_name}
                        onChange={(event) =>
                            setAccount(
                                index,
                                'account_name',
                                event.target.value,
                            )
                        }
                    />
                    <Input
                        aria-label="Account number"
                        placeholder="Account number"
                        value={account.account_number}
                        onChange={(event) =>
                            setAccount(
                                index,
                                'account_number',
                                event.target.value,
                            )
                        }
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Remove account"
                        onClick={() =>
                            form.setData(
                                'accounts',
                                form.data.accounts.filter(
                                    (_, current) => current !== index,
                                ),
                            )
                        }
                    >
                        <Trash2 />
                    </Button>
                </div>
            ))}
            <InputError message={Object.values(form.errors)[0]} />
            <div className="flex justify-between gap-2">
                {form.data.accounts.length < 3 ? (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            form.setData('accounts', [
                                ...form.data.accounts,
                                {
                                    bank_name: '',
                                    account_name: '',
                                    account_number: '',
                                },
                            ])
                        }
                    >
                        <Plus /> Add account
                    </Button>
                ) : (
                    <span />
                )}
                <Button
                    type="submit"
                    size="sm"
                    disabled={form.processing || !form.isDirty}
                >
                    Save accounts
                </Button>
            </div>
        </form>
    );
}

function GraceForm({ days }: { days: number }) {
    const form = useForm({ grace_days: String(days) });

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                form.put(admin.billing.grace.update().url, {
                    preserveScroll: true,
                });
            }}
            className="space-y-3 rounded-xl border p-4"
        >
            <div>
                <p className="font-medium">Grace period</p>
                <p className="text-sm text-muted-foreground">
                    Days an invoice can be overdue before that owner's booking
                    page stops taking online bookings.
                </p>
            </div>
            <div className="flex gap-2">
                <Input
                    aria-label="Grace period in days"
                    type="number"
                    min={1}
                    max={90}
                    value={form.data.grace_days}
                    onChange={(event) =>
                        form.setData('grace_days', event.target.value)
                    }
                    className="w-24 tabular-nums"
                />
                <Button
                    type="submit"
                    size="sm"
                    className="h-9"
                    disabled={form.processing || !form.isDirty}
                >
                    Save
                </Button>
            </div>
            <InputError message={form.errors.grace_days} />
        </form>
    );
}

function RejectButton({ invoice }: { invoice: AdminInvoice }) {
    const [isOpen, setIsOpen] = useState(false);
    const [reason, setReason] = useState('');

    if (!isOpen) {
        return (
            <Button size="sm" variant="outline" onClick={() => setIsOpen(true)}>
                Send back
            </Button>
        );
    }

    return (
        <form
            className="flex gap-1"
            onSubmit={(event) => {
                event.preventDefault();
                router.put(
                    admin.billing.invoices.review(invoice.id).url,
                    { decision: 'rejected', reason },
                    { preserveScroll: true },
                );
            }}
        >
            <Input
                aria-label="Reason"
                className="h-8 w-44"
                placeholder="Reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                autoFocus
                required
            />
            <Button size="sm" type="submit">
                Send
            </Button>
        </form>
    );
}

export default function AdminBilling({
    invoices,
    status,
    counts,
    bankAccounts,
    graceDays,
}: {
    graceDays: number;
    invoices: Paginated<AdminInvoice>;
    status: string | null;
    counts: Record<string, number>;
    bankAccounts: BankAccount[];
}) {
    const { apply } = useQueryFilters(admin.billing.index(), { status });

    return (
        <>
            <Head title="Billing" />

            <div className="space-y-6 p-4 md:p-6">
                <Heading
                    title="Billing"
                    description="Owners' monthly invoices. Check transfers against your account, then mark them paid."
                />

                <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
                    <AccountsForm accounts={bankAccounts} />
                    <GraceForm days={graceDays} />
                </div>

                <StatusTabs
                    statuses={(
                        Object.keys(statusLabels) as AdminInvoice['status'][]
                    ).map((value) => ({
                        value,
                        label: `${statusLabels[value]} (${counts[value] ?? 0})`,
                    }))}
                    value={status}
                    onChange={(value) => apply({ status: value })}
                />

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Invoice</TableHead>
                            <TableHead>Owner</TableHead>
                            <TableHead>Period</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invoices.data.map((invoice) => (
                            <TableRow key={invoice.id}>
                                <TableCell>
                                    <p className="font-mono text-xs">
                                        {invoice.number}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {invoice.plan_name}
                                    </p>
                                </TableCell>
                                <TableCell className="font-medium">
                                    {invoice.owner}
                                </TableCell>
                                <TableCell className="text-sm whitespace-nowrap text-muted-foreground">
                                    {format(
                                        parseISO(invoice.period_start),
                                        'MMM d',
                                    )}{' '}
                                    –{' '}
                                    {format(
                                        parseISO(invoice.period_end),
                                        'MMM d, yyyy',
                                    )}
                                </TableCell>
                                <TableCell className="text-right tabular-nums">
                                    {formatPeso(invoice.amount)}
                                </TableCell>
                                <TableCell>
                                    <p className="text-sm">
                                        {statusLabels[invoice.status]}
                                    </p>
                                    {invoice.is_overdue && (
                                        <p className="text-xs text-destructive">
                                            Overdue
                                        </p>
                                    )}
                                    {invoice.payment_reference && (
                                        <p className="text-xs text-muted-foreground">
                                            Ref {invoice.payment_reference}
                                        </p>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {invoice.status === 'submitted' && (
                                        <div className="flex flex-wrap justify-end gap-2">
                                            {invoice.has_proof && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    asChild
                                                >
                                                    <a
                                                        href={
                                                            admin.billing.invoices.proof(
                                                                invoice.id,
                                                            ).url
                                                        }
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        Screenshot
                                                    </a>
                                                </Button>
                                            )}
                                            <RejectButton invoice={invoice} />
                                            <Button
                                                size="sm"
                                                onClick={() =>
                                                    router.put(
                                                        admin.billing.invoices.review(
                                                            invoice.id,
                                                        ).url,
                                                        { decision: 'paid' },
                                                        {
                                                            preserveScroll: true,
                                                        },
                                                    )
                                                }
                                            >
                                                Mark paid
                                            </Button>
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {invoices.data.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                        No invoices here.
                    </p>
                )}
                <PaginationLinks paginated={invoices} />
            </div>
        </>
    );
}

AdminBilling.layout = {
    breadcrumbs: [{ title: 'Billing', href: admin.billing.index() }],
};
