import { Link, usePage } from '@inertiajs/react';
import { AlertTriangle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import lessor from '@/routes/lessor';

type BillingStatus = {
    overdue: number;
    paused: boolean;
    grace_days: number;
    unpaid: number;
    has_plan: boolean;
} | null;

/**
 * A slim reminder above the owner's pages: an overdue invoice, or no plan
 * picked yet.
 */
export function BillingBanner() {
    const billing = usePage<{ billing?: BillingStatus }>().props.billing;

    if (!billing) {
        return null;
    }

    const message = billing.paused
        ? 'Your booking page has stopped taking online bookings because an invoice is overdue. Pay it to turn bookings back on.'
        : billing.overdue > 0
          ? `You have ${billing.overdue === 1 ? 'an overdue invoice' : `${billing.overdue} overdue invoices`}. Online bookings pause ${billing.grace_days} days after the due date.`
          : !billing.has_plan
            ? "Pick a plan to start taking online bookings. Until then, renters see your page but can't book online."
            : null;

    if (!message) {
        return null;
    }

    const isUrgent = billing.paused || billing.overdue > 0;
    const Icon = isUrgent ? AlertTriangle : Sparkles;

    return (
        <Link
            href={lessor.billing.index()}
            className={cn(
                'flex items-center gap-2 border-b px-6 py-2 text-sm transition-colors md:px-4',
                isUrgent
                    ? 'bg-amber-500/10 text-amber-900 hover:bg-amber-500/15 dark:text-amber-200'
                    : 'bg-brand/5 hover:bg-brand/10',
            )}
        >
            <Icon className="size-4 shrink-0" />
            <span className="flex-1">{message}</span>
            <span className="font-medium underline underline-offset-4">
                Billing
            </span>
        </Link>
    );
}
