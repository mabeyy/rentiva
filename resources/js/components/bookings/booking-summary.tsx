import type { BookingQuote } from '@/lib/booking-quote';
import { formatPeso } from '@/lib/format';

function Line({
    label,
    amount,
    isCredit = false,
}: {
    label: string;
    amount: number;
    isCredit?: boolean;
}) {
    return (
        <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">{label}</span>
            <span
                className={
                    isCredit
                        ? 'text-emerald-700 tabular-nums dark:text-emerald-400'
                        : 'tabular-nums'
                }
            >
                {isCredit ? '−' : ''}
                {formatPeso(amount)}
            </span>
        </div>
    );
}

/**
 * A rental's price: days at the rate, any discount and extras, the total,
 * and the refundable deposit underneath.
 */
export function BookingSummary({
    quote,
    totalLabel = 'Total',
}: {
    quote: BookingQuote;
    /** e.g. "Total, paid at pickup" once the payment method is known. */
    totalLabel?: string;
}) {
    return (
        <div className="space-y-2.5 rounded-2xl bg-muted/40 p-4 text-sm">
            <Line
                label={`${formatPeso(quote.dailyRate)} × ${quote.days} ${quote.days === 1 ? 'day' : 'days'}`}
                amount={quote.dailyRate * quote.days}
            />
            {quote.subtotal !== quote.dailyRate * quote.days && (
                <Line
                    label={
                        quote.subtotal > quote.dailyRate * quote.days
                            ? 'Peak season'
                            : 'Low season'
                    }
                    amount={Math.abs(
                        quote.subtotal - quote.dailyRate * quote.days,
                    )}
                    isCredit={quote.subtotal < quote.dailyRate * quote.days}
                />
            )}
            {quote.discount > 0 && (
                <Line
                    label={`${quote.discountPercent}% long-stay discount`}
                    amount={quote.discount}
                    isCredit
                />
            )}
            {quote.driverFee > 0 && (
                <Line label="Driver" amount={quote.driverFee} />
            )}
            {quote.deliveryFee > 0 && (
                <Line label="Delivery" amount={quote.deliveryFee} />
            )}
            {(quote.chargesTotal ?? 0) > 0 && (
                <Line label="Extra charges" amount={quote.chargesTotal ?? 0} />
            )}
            <div className="border-t border-dashed" />
            <div className="flex items-baseline justify-between font-semibold">
                <span>{totalLabel}</span>
                <span className="font-display text-xl font-extrabold text-brand tabular-nums">
                    {formatPeso(quote.total)}
                </span>
            </div>
            {quote.securityDeposit > 0 && (
                <p className="text-xs text-muted-foreground">
                    Plus a {formatPeso(quote.securityDeposit)} refundable
                    deposit at pickup, returned with the car.
                </p>
            )}
        </div>
    );
}
