import { Form } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import {
    Banknote,
    CircleCheck,
    Clock,
    Landmark,
    TriangleAlert,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { TransferAccountCard } from '@/components/bookings/transfer-account-card';
import { FormField } from '@/components/form-field';
import { BrandButton } from '@/components/public/brand-button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { formatManilaDateTime, formatPeso } from '@/lib/format';
import type { PaymentAccount } from '@/components/lessor/payment-settings-section';
import type { Booking } from '@/types';
import { FilePicker } from '@/components/file-picker';

/** The owner's accounts to transfer to, and the signed URL to report it. */
export type TransferDetails = {
    accounts: PaymentAccount[];
    /** Set while the renter should (re)send the transfer. */
    submit_url: string | null;
};

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
        // Someone who paid and then lost the booking needs to hear about their money.
        if (booking.amount_paid > 0 && !booking.refunded_at) {
            return (
                <section className="rounded-3xl border p-6">
                    <Notice
                        icon={Banknote}
                        tone="neutral"
                        title="About your payment"
                    >
                        You paid {formatPeso(booking.amount_paid)} for this
                        booking. The owner handles refunds under their
                        cancellation policy; contact them if you haven't heard
                        back. You'll see it here once they record it.
                    </Notice>
                </section>
            );
        }

        return null;
    }

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

            {!isTransfer &&
                (booking.payment_status.value === 'paid' ? (
                    <Notice icon={CircleCheck} tone="success" title="Paid">
                        The owner received {formatPeso(booking.amount_paid)}.{' '}
                        {booking.balance_due > 0
                            ? `Bring the remaining ${formatPeso(booking.balance_due)} at pickup.`
                            : "You're all set."}
                    </Notice>
                ) : (
                    <p className="text-muted-foreground">
                        Bring{' '}
                        <strong className="text-foreground">
                            {formatPeso(booking.balance_due)}
                        </strong>{' '}
                        when you collect the car. Pay the owner in cash or as
                        they ask.
                    </p>
                ))}

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
                    The owner received {formatPeso(booking.amount_paid)}
                    {booking.paid_at &&
                        ` on ${formatManilaDateTime(booking.paid_at).split(' · ')[0]}`}
                    .{' '}
                    {booking.balance_due > 0
                        ? `Bring the remaining ${formatPeso(booking.balance_due)} at pickup.`
                        : booking.overpaid > 0
                          ? `That's ${formatPeso(booking.overpaid)} more than the new total; the owner will refund the difference.`
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
                            title={`Send it by ${formatManilaDateTime(booking.payment_due_at)}`}
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
                            <TransferAccountCard
                                key={account.id}
                                account={account}
                            />
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
                                        <FilePicker
                                            id="payment_proof"
                                            name="payment_proof"
                                            placeholder="Add the screenshot from your app"
                                            required
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
