import { Head } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import type { LucideIcon } from 'lucide-react';
import {
    Ban,
    Banknote,
    CalendarCheck,
    CalendarCog,
    CalendarOff,
    Check,
    CircleCheck,
    CirclePlus,
    ClipboardCheck,
    ReceiptText,
    Undo2,
    Wallet,
    IdCard,
    MessageSquareReply,
    History,
    Landmark,
    Send,
    Star,
    X,
} from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/lessor/page-header';
import { OptionSelect } from '@/components/option-select';
import { PaginationLinks } from '@/components/pagination-links';
import { SearchInput } from '@/components/search-input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useQueryFilters } from '@/hooks/use-query-filters';
import { cn } from '@/lib/utils';
import lessor from '@/routes/lessor';
import type { Option, Paginated } from '@/types';
import type { RouteDefinition } from '@/wayfinder';

export type ActivityEvent = {
    id: number;
    action: string;
    actor_type: 'renter' | 'owner' | 'staff' | 'admin' | 'system';
    actor_name: string;
    description: string | null;
    created_at: string | null;
    /** Null for car events, like blocked dates. */
    reference: string | null;
    renter_name: string | null;
    car_name: string | null;
    /** Admin view only: the business the booking belongs to. */
    owner_name?: string | null;
};

export type ActivityFilters = {
    search?: string;
    action?: string;
    actor?: string;
    owner?: string;
};

export const actionMeta: Record<
    string,
    { label: string; icon: LucideIcon; tone: string }
> = {
    requested: {
        label: 'Requested',
        icon: Send,
        tone: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
    },
    added: {
        label: 'Added by owner',
        icon: CirclePlus,
        tone: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
    },
    confirmed: {
        label: 'Confirmed',
        icon: Check,
        tone: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    },
    declined: {
        label: 'Declined',
        icon: X,
        tone: 'bg-destructive/10 text-destructive',
    },
    cancelled: {
        label: 'Cancelled',
        icon: Ban,
        tone: 'bg-destructive/10 text-destructive',
    },
    completed: {
        label: 'Completed',
        icon: CircleCheck,
        tone: 'bg-muted text-muted-foreground',
    },
    payment_submitted: {
        label: 'Transfer sent',
        icon: Landmark,
        tone: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    },
    payment_approved: {
        label: 'Marked paid',
        icon: Banknote,
        tone: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    },
    payment_rejected: {
        label: 'Payment rejected',
        icon: X,
        tone: 'bg-destructive/10 text-destructive',
    },
    reviewed: {
        label: 'Reviewed',
        icon: Star,
        tone: 'bg-brand/10 text-brand',
    },
    license_checked: {
        label: 'License checked',
        icon: IdCard,
        tone: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    },
    replied: {
        label: 'Replied to review',
        icon: MessageSquareReply,
        tone: 'bg-brand/10 text-brand',
    },
    changed: {
        label: 'Booking changed',
        icon: CalendarCog,
        tone: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
    },
    change_requested: {
        label: 'Change requested',
        icon: CalendarCog,
        tone: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
    },
    change_withdrawn: {
        label: 'Change withdrawn',
        icon: Undo2,
        tone: 'bg-muted text-muted-foreground',
    },
    change_declined: {
        label: 'Change declined',
        icon: X,
        tone: 'bg-muted text-muted-foreground',
    },
    refunded: {
        label: 'Refunded',
        icon: Undo2,
        tone: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    },
    charged: {
        label: 'Charge added',
        icon: ReceiptText,
        tone: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    },
    deposit_collected: {
        label: 'Deposit collected',
        icon: Wallet,
        tone: 'bg-muted text-muted-foreground',
    },
    deposit_returned: {
        label: 'Deposit returned',
        icon: Undo2,
        tone: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    },
    pickup_checked: {
        label: 'Pickup check',
        icon: ClipboardCheck,
        tone: 'bg-muted text-muted-foreground',
    },
    return_checked: {
        label: 'Return check',
        icon: ClipboardCheck,
        tone: 'bg-muted text-muted-foreground',
    },
    blocked: {
        label: 'Dates blocked',
        icon: CalendarOff,
        tone: 'bg-muted text-muted-foreground',
    },
    block_changed: {
        label: 'Block changed',
        icon: CalendarCog,
        tone: 'bg-muted text-muted-foreground',
    },
    unblocked: {
        label: 'Dates opened',
        icon: CalendarCheck,
        tone: 'bg-muted text-muted-foreground',
    },
};

const actionOptions = Object.entries(actionMeta).map(([value, meta]) => ({
    value,
    label: meta.label,
}));

const ownerActorOptions = [
    { value: 'renter', label: 'Renters' },
    { value: 'owner', label: 'You' },
    { value: 'staff', label: 'Your staff' },
];

const adminActorOptions = [
    { value: 'renter', label: 'Renters' },
    { value: 'owner', label: 'Owners' },
    { value: 'staff', label: 'Staff' },
    { value: 'admin', label: 'Admins' },
    { value: 'system', label: 'Automatic' },
];

const actorLabels: Record<ActivityEvent['actor_type'], string> = {
    renter: 'Renter',
    owner: 'Owner',
    staff: 'Staff',
    admin: 'Rentiva admin',
    system: 'Automatic',
};

/**
 * The activity feed and its filters. Owners see their own bookings ("You" for
 * their actions); admins see every owner, with an owner column and filter.
 */
export function ActivityFeed({
    events,
    filters,
    filterRoute,
    owners,
    description,
}: {
    events: Paginated<ActivityEvent>;
    filters: ActivityFilters;
    filterRoute: RouteDefinition<'get'>;
    /** Set for the admin view. */
    owners?: Option[];
    description: string;
}) {
    const isAdmin = owners !== undefined;
    const { apply } = useQueryFilters(filterRoute, filters);

    return (
        <>
            <Head title="Activity" />

            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8">
                <PageHeader title="Activity" description={description} />

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <SearchInput
                        value={filters.search}
                        onSearch={(search) => apply({ search })}
                        placeholder="Search reference, renter, car or person"
                        className="max-w-none flex-1"
                    />
                    {owners && (
                        <OptionSelect
                            options={owners}
                            value={filters.owner ?? null}
                            onChange={(owner) => apply({ owner })}
                            anyLabel="All owners"
                            className="sm:w-52"
                        />
                    )}
                    <OptionSelect
                        options={
                            isAdmin ? adminActorOptions : ownerActorOptions
                        }
                        value={filters.actor ?? null}
                        onChange={(actor) => apply({ actor })}
                        anyLabel="Everyone"
                        className="sm:w-40"
                    />
                    <OptionSelect
                        options={actionOptions}
                        value={filters.action ?? null}
                        onChange={(action) => apply({ action })}
                        anyLabel="All actions"
                        className="sm:w-48"
                    />
                </div>

                {events.data.length === 0 ? (
                    <EmptyState
                        icon={History}
                        title="No activity found"
                        description="Try a different search or filter."
                    />
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Action</TableHead>
                                <TableHead>Booking or car</TableHead>
                                {isAdmin && <TableHead>Owner</TableHead>}
                                <TableHead>Renter</TableHead>
                                <TableHead>By</TableHead>
                                <TableHead className="text-right">
                                    When
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {events.data.map((event) => {
                                const meta = actionMeta[event.action] ?? {
                                    label: event.action,
                                    icon: History,
                                    tone: 'bg-muted text-muted-foreground',
                                };
                                const Icon = meta.icon;

                                return (
                                    <TableRow key={event.id}>
                                        <TableCell className="whitespace-normal">
                                            <span
                                                className={cn(
                                                    'inline-flex items-center gap-1.5 rounded-full py-0.5 pr-2.5 pl-1.5 text-xs font-medium',
                                                    meta.tone,
                                                )}
                                            >
                                                <Icon className="size-3.5" />
                                                {meta.label}
                                            </span>
                                            {event.description && (
                                                <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                                                    {event.description}
                                                </p>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {event.reference && (
                                                <p className="font-mono text-xs">
                                                    {event.reference}
                                                </p>
                                            )}
                                            <p
                                                className={cn(
                                                    event.reference
                                                        ? 'text-xs text-muted-foreground'
                                                        : 'text-sm font-medium',
                                                )}
                                            >
                                                {event.car_name}
                                            </p>
                                        </TableCell>
                                        <TableCell>
                                            {event.renter_name ?? (
                                                <span className="text-muted-foreground">
                                                    —
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <p className="font-medium">
                                                {event.actor_type === 'owner' &&
                                                !isAdmin
                                                    ? 'You'
                                                    : event.actor_name}
                                            </p>
                                            {(isAdmin ||
                                                event.actor_type !==
                                                    'owner') && (
                                                <p className="text-xs text-muted-foreground">
                                                    {
                                                        actorLabels[
                                                            event.actor_type
                                                        ]
                                                    }
                                                </p>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground tabular-nums">
                                            {event.created_at &&
                                                format(
                                                    parseISO(event.created_at),
                                                    'MMM d, yyyy · h:mm a',
                                                )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}

                <PaginationLinks paginated={events} />
            </div>
        </>
    );
}

export default function LessorActivity({
    events,
    filters,
}: {
    events: Paginated<ActivityEvent>;
    filters: ActivityFilters;
}) {
    return (
        <ActivityFeed
            events={events}
            filters={filters}
            filterRoute={lessor.activity()}
            description="Every request, confirmation, payment, review and blocked date on your bookings and cars, and who did it."
        />
    );
}

LessorActivity.layout = {
    breadcrumbs: [{ title: 'Activity', href: lessor.activity() }],
};
