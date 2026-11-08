import { Form } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import type { LucideIcon } from 'lucide-react';
import {
    Banknote,
    Check,
    CircleCheck,
    Clock,
    Copy,
    Landmark,
    TriangleAlert,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { FormField } from '@/components/form-field';
import { BrandButton } from '@/components/public/brand-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useClipboard } from '@/hooks/use-clipboard';
import { formatPeso } from '@/lib/format';
import type { PaymentAccount } from '@/components/lessor/payment-settings-section';
import type { Booking } from '@/types';

/** The owner's accounts to transfer to, and the signed URL to report it. */
export type TransferDetails = {
    accounts: PaymentAccount[];
    /** Set while the renter should (re)send the transfer. */
    submit_url: string | null;
};

function CopyRow({ label, value }: { label: string; value: string }) {
    const [copiedText, copy] = useClipboard();
    const isCopied = copiedText === value;

    return (
        <div className="flex items-center justify-between gap-3 py-2">
            <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="truncate font-medium tabular-nums">{value}</p>
            </div>
            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => copy(value)}
            >
                {isCopied ? <Check /> : <Copy />}
                {isCopied ? 'Copied' : 'Copy'}
            </Button>
        </div>
    );
}

function Notice({
    icon: Icon,
    tone,
    title,
    children,
}: {
    icon: LucideIcon;
    tone: 'neutral' | 'success' | 'warning';
    title: string;
    children: ReactNode;
}) {
    const tones = {
        neutral: 'bg-muted/50 text-foreground',
        success:
            'bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
        warning:
            'bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
    };

    return (
        <div className={`flex gap-3 rounded-2xl p-4 ${tones[tone]}`}>
            <Icon className="mt-0.5 size-5 shrink-0" />
            <div className="text-sm">
                <p className="font-semibold">{title}</p>
                <div className="mt-0.5 opacity-80">{children}</div>
            </div>
        </div>
    );
}

/**
 * The renter's side of paying: a note for pay-at-pickup, or for a bank
 * transfer, where to send it and a form to report it once the owner confirms.
 */
export function BookingPaymentCard({
    booking,
    transfer,
}: {
    booking: Booking;
    transfer: TransferDetails | null;
}) {
    if (['declined', 'cancelled'].includes(booking.status.value)) {
        return null;
    }

    const total = formatPeso(booking.total);
    const isTransfer = booking.payment_method.value === 'bank_transfer';
    const isDownPayment = booking.down_payment > 0;
    const transferAmount = formatPeso(booking.transfer_amount);
    const balance = formatPeso(booking.total - booking.down_payment);

    return (
        <section className="space-y-4 rounded-3xl border p-6">
            <h2 className="flex items-center gap-2 font-display text-xl font-bold tracking-tight">
                {isTransfer ? (
                    <Landmark className="size-5 text-brand" />
                ) : (
                    <Banknote className="size-5 text-brand" />
                )}
                {booking.payment_method.label}
            </h2>

            {!isTransfer && (
                <p className="text-muted-foreground">
                    Bring <strong className="text-foreground">{total}</strong>{' '}
                    when you collect the car. Pay the owner in cash or as they
                    ask.
                </p>
            )}

            {isTransfer && booking.status.value === 'pending' && (
                <Notice icon={Clock} tone="neutral" title="Nothing to pay yet">
                    Bank details appear here once the owner confirms your
                    booking.
                </Notice>
            )}

            {isTransfer && booking.payment_status.value === 'submitted' && (
                <Notice
                    icon={Clock}
                    tone="neutral"
                    title="The owner is checking your transfer"
                >
                    Reference {booking.payment_reference}. We'll email you once
                    they confirm it arrived.
                </Notice>
            )}

            {isTransfer && booking.payment_status.value === 'paid' && (
                <Notice
                    icon={CircleCheck}
                    tone="success"
                    title={isDownPayment ? 'Down payment received' : 'Paid'}
                >
                    The owner received {transferAmount}
                    {booking.paid_at &&
                        ` on ${format(parseISO(booking.paid_at), 'MMM d, yyyy')}`}
                    .{' '}
                    {isDownPayment
                        ? `Bring the remaining ${balance} at pickup.`
                        : "You're all set."}
                </Notice>
            )}

            {isTransfer && transfer?.submit_url && (
                <>
                    {booking.payment_status.value === 'rejected' && (
                        <Notice
                            icon={TriangleAlert}
                            tone="warning"
                            title="Please send your payment again"
                        >
                            {booking.payment_rejection_reason}
                        </Notice>
                    )}

                    <p className="text-muted-foreground">
                        {isDownPayment
                            ? `Transfer the down payment below to lock your dates, then tell the owner the reference number. The remaining ${balance} is paid at pickup.`
                            : 'Transfer the amount below, then tell the owner the reference number from your receipt.'}
                    </p>

                    {booking.payment_due_at && (
                        <Notice
                            icon={Clock}
                            tone="warning"
                            title={`Send it by ${format(parseISO(booking.payment_due_at), 'EEE, MMM d · h:mm a')}`}
                        >
                            If the owner doesn't receive your transfer by then,
                            the booking is cancelled and the dates are released.
                        </Notice>
                    )}

                    <div className="flex items-center justify-between rounded-2xl bg-brand/5 px-4 py-3">
                        <span className="text-sm text-muted-foreground">
                            {isDownPayment
                                ? 'Down payment to send'
                                : 'Amount to send'}
                        </span>
                        <span className="font-display text-2xl font-extrabold text-brand tabular-nums">
                            {transferAmount}
                        </span>
                    </div>

                    <div className="space-y-3">
                        {transfer.accounts.length > 1 && (
                            <p className="text-sm text-muted-foreground">
                                Send to any one of these accounts:
                            </p>
                        )}
                        {transfer.accounts.map((account) => (
                            <div
                                key={account.id}
                                className="grid gap-4 rounded-2xl border p-4 sm:grid-cols-[1fr_auto] sm:items-center"
                            >
                                <div className="divide-y">
                                    <CopyRow
                                        label="Bank or e-wallet"
                                        value={account.bank_name}
                                    />
                                    <CopyRow
                                        label="Account name"
                                        value={account.account_name}
                                    />
                                    <CopyRow
                                        label="Account number"
                                        value={account.account_number}
                                    />
                                </div>
                                {account.qr_url && (
                                    <img
                                        src={account.qr_url}
                                        alt={`QR code for ${account.bank_name}`}
                                        className="mx-auto size-36 rounded-2xl border bg-white object-contain p-2"
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    <Form
                        action={transfer.submit_url}
                        method="post"
                        options={{ preserveScroll: true }}
                        className="space-y-4 rounded-2xl bg-muted/40 p-4"
                    >
                        {({ processing, errors }) => (
                            <>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <FormField
                                        id="payment_reference"
                                        label="Reference number"
                                        error={errors.payment_reference}
                                    >
                                        <Input
                                            id="payment_reference"
                                            name="payment_reference"
                                            required
                                            placeholder="From your bank or GCash receipt"
                                            className="bg-background"
                                        />
                                    </FormField>
                                    <FormField
                                        id="payment_proof"
                                        label="Screenshot of the transfer"
                                        error={errors.payment_proof}
                                    >
                                        <Input
                                            id="payment_proof"
                                            name="payment_proof"
                                            type="file"
                                            required
                                            accept="image/jpeg,image/png,image/webp"
                                            className="bg-background"
                                        />
                                    </FormField>
                                </div>
                                <BrandButton
                                    type="submit"
                                    className="rounded-full px-6"
                                    disabled={processing}
                                >
                                    {processing && <Spinner />}I've sent the
                                    payment
                                </BrandButton>
                            </>
                        )}
                    </Form>
                </>
            )}
        </section>
    );
}
