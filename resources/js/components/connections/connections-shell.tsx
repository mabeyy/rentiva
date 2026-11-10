import { Link } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import { BellRing, CalendarDays, Send, ShieldAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { PageHeader } from '@/components/lessor/page-header';
import { cn } from '@/lib/utils';

export type ConnectionPage = 'notifications' | 'calendar' | 'deliveries';

export type ConnectionContext = {
    page: ConnectionPage;
    /** Admins can always edit; owners only their calendar, on plans with it. */
    canEdit: boolean;
    /** What the owner's plan includes. */
    plan: {
        name: string | null;
        email: boolean;
        sms: boolean;
        calendar_sync: boolean;
        branded_email: boolean;
    };
    /** Set when an admin is configuring an owner's connections for them. */
    managedOwner: { name: string; business: string | null; url: string } | null;
    urls: Record<ConnectionPage, string> & {
        /** The calendar's save and test addresses, when it can be edited. */
        update: string | null;
        test: string | null;
        /** Email and SMS save and test addresses; admins only. */
        email_update: string | null;
        email_test: string | null;
        sms_update: string | null;
        sms_test: string | null;
        reminders: string;
        /** Null for admins, who don't have the owner's Policies page. */
        policies: string | null;
        /** The owner's Billing page; null for admins. */
        billing: string | null;
    };
};

const tabs: { key: ConnectionPage; label: string; icon: LucideIcon }[] = [
    { key: 'notifications', label: 'Notifications', icon: BellRing },
    { key: 'calendar', label: 'Google Calendar', icon: CalendarDays },
    { key: 'deliveries', label: 'Deliveries', icon: Send },
];

/**
 * Header and tabs shared by the connection pages, for owners and for admins
 * helping an owner.
 */
export function ConnectionsShell({
    context,
    description,
    children,
}: {
    context: ConnectionContext;
    description: string;
    children: ReactNode;
}) {
    return (
        <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8">
            {context.managedOwner && (
                <p className="flex flex-wrap items-center gap-2 rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
                    <ShieldAlert className="size-4 shrink-0" />
                    You're managing the connections of{' '}
                    <strong>
                        {context.managedOwner.business ??
                            context.managedOwner.name}
                    </strong>
                    .
                    <Link
                        href={context.managedOwner.url}
                        className="ml-auto font-medium underline underline-offset-4"
                    >
                        Back to owner
                    </Link>
                </p>
            )}

            <PageHeader
                title={tabs.find((tab) => tab.key === context.page)!.label}
                description={description}
            />

            <nav
                aria-label="Connections"
                className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-full border bg-background p-1"
            >
                {tabs.map(({ key, label, icon: Icon }) => (
                    <Link
                        key={key}
                        href={context.urls[key]}
                        aria-current={context.page === key ? 'page' : undefined}
                        className={cn(
                            'flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-medium transition-colors [&_svg]:size-4',
                            context.page === key
                                ? 'bg-ink text-ink-foreground'
                                : 'text-muted-foreground hover:text-foreground',
                        )}
                    >
                        <Icon /> {label}
                    </Link>
                ))}
            </nav>

            {children}
        </div>
    );
}

/** Shown when the owner hasn't created their booking page yet. */
export function NeedsBookingPage() {
    return (
        <p className="rounded-3xl border border-dashed p-8 text-center text-muted-foreground">
            Create the booking page first; connections send emails, texts and
            calendar events for its bookings.
        </p>
    );
}

/** A small "Connected / Not connected" pill. */
export function ConnectionStatus({ connected }: { connected: boolean }) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
                connected
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                    : 'bg-muted text-muted-foreground',
            )}
        >
            <span
                className={cn(
                    'size-1.5 rounded-full',
                    connected ? 'bg-emerald-500' : 'bg-muted-foreground/50',
                )}
            />
            {connected ? 'Connected' : 'Not connected'}
        </span>
    );
}

/**
 * In place of the settings form: who set the channel up, whether it's on,
 * and what plan unlocks it. Admins see a warning instead when the owner's
 * plan doesn't include what they're setting up.
 */
export function ManagedNotice({
    context,
    title,
    children,
    isIncluded,
    upgradeLabel,
}: {
    context: ConnectionContext;
    title: string;
    children: ReactNode;
    isIncluded: boolean;
    upgradeLabel: string;
}) {
    return (
        <section className="space-y-3 rounded-3xl border bg-background p-5 sm:p-6">
            <div className="flex items-start gap-3">
                <span
                    className={cn(
                        'flex size-10 shrink-0 items-center justify-center rounded-full',
                        isIncluded
                            ? 'bg-brand/10 text-brand'
                            : 'bg-muted text-muted-foreground',
                    )}
                >
                    <ShieldAlert className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                    <h2 className="font-display text-lg font-bold tracking-tight">
                        {title}
                    </h2>
                    <div className="mt-1 space-y-1 text-sm text-muted-foreground">
                        {children}
                    </div>
                </div>
            </div>
            {!isIncluded && context.urls.billing && (
                <Link
                    href={context.urls.billing}
                    className="inline-flex items-center rounded-full bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand/90"
                >
                    {upgradeLabel}
                </Link>
            )}
        </section>
    );
}

/** For admins: the owner's plan doesn't include this yet. */
export function PlanWarning({
    context,
    feature,
}: {
    context: ConnectionContext;
    feature: string;
}) {
    if (!context.managedOwner) {
        return null;
    }

    return (
        <p className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
            {context.plan.name
                ? `${feature} isn't in their ${context.plan.name} plan.`
                : `${feature} isn't in their plan. They don't have one yet.`}{' '}
            You can set it up now; it starts working when they upgrade.
        </p>
    );
}
