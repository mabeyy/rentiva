import { format, parseISO } from 'date-fns';
import { Copy, MessageSquareText, Phone } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { formatPeso } from '@/lib/format';
import type { Booking } from '@/types';

/** The update a renter needs about their money, written for a text. */
function noticeFor(booking: Booking, business: string): string | null {
    const hi = `Hi ${booking.renter_name.split(' ')[0]}, this is ${business} about booking ${booking.reference}.`;

    if (booking.refunded_at) {
        return `${hi} We refunded ${formatPeso(booking.refund_amount ?? 0)}${booking.refund_reference ? ` (ref ${booking.refund_reference})` : ''}.${booking.refund_note ? ` ${booking.refund_note}` : ''}`;
    }

    if (booking.payment_status.value === 'rejected') {
        return `${hi} We couldn't confirm your transfer: ${booking.payment_rejection_reason}. Please send ${formatPeso(booking.transfer_amount)} again${booking.payment_due_at ? ` by ${format(parseISO(booking.payment_due_at), 'MMM d, h:mm a')}` : ''} and update your booking page.`;
    }

    if (
        booking.payment_method.value === 'bank_transfer' &&
        booking.payment_status.value === 'paid' &&
        ['confirmed', 'completed'].includes(booking.status.value)
    ) {
        return `${hi} We received your payment of ${formatPeso(booking.transfer_amount)}. See you on ${format(parseISO(booking.start_date), 'MMM d')}!`;
    }

    return null;
}

/**
 * On plans without booking emails, a ready-to-send text for payment results
 * and refunds, so the renter still finds out.
 */
export function RenterNoticeCard({
    booking,
    businessName,
}: {
    booking: Booking;
    businessName: string;
}) {
    const [isCopied, setIsCopied] = useState(false);
    const message = noticeFor(booking, businessName);

    if (!message) {
        return null;
    }

    function copy(): void {
        navigator.clipboard?.writeText(message!).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    }

    return (
        <section className="space-y-3 rounded-3xl border border-sky-500/40 bg-sky-500/5 p-5">
            <div>
                <h2 className="text-sm font-semibold">Tell the renter</h2>
                <p className="text-xs text-muted-foreground">
                    Your plan doesn't email renters about payments and refunds.
                    Send this yourself:
                </p>
            </div>
            <p className="rounded-2xl bg-background p-3 text-sm whitespace-pre-line">
                {message}
            </p>
            <div className="flex flex-wrap gap-2">
                <Button size="sm" className="rounded-full" asChild>
                    <a
                        href={`sms:${booking.renter_phone}?body=${encodeURIComponent(message)}`}
                    >
                        <MessageSquareText /> Text
                    </a>
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    asChild
                >
                    <a href={`tel:${booking.renter_phone}`}>
                        <Phone /> Call
                    </a>
                </Button>
                <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-full"
                    onClick={copy}
                >
                    <Copy /> {isCopied ? 'Copied' : 'Copy'}
                </Button>
            </div>
        </section>
    );
}
