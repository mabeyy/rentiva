import { Link, router, usePage, usePoll } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { formatDistanceToNowStrict, parseISO } from 'date-fns';
import {
    Bell,
    BellRing,
    CalendarClock,
    FileWarning,
    Landmark,
    MessageSquare,
    Receipt,
    Send,
    XCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type OwnerAlert = {
    id: string;
    action: string;
    title: string;
    body: string;
    url: string;
    open_url: string;
    read: boolean;
    created_at: string | null;
};

type SharedNotifications = {
    unread: number;
    read_url: string;
    items: OwnerAlert[];
} | null;

const actionIcons: Record<string, LucideIcon> = {
    requested: Send,
    payment_submitted: Landmark,
    cancelled: XCircle,
    reviewed: MessageSquare,
    paper_expiring: FileWarning,
    invoice: Receipt,
    invoice_paid: Receipt,
    change_requested: CalendarClock,
};

/** How often the bell checks for new alerts. */
const POLL_MS = 30_000;

/** Whether this browser can show desktop notifications. */
function supportsDesktopAlerts(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * The owner's in-app alerts: new requests, transfers to check, cancellations
 * and reviews. Checks for new ones every 30 seconds and, if allowed, shows a
 * desktop notification. Opening one marks it read and goes to the booking.
 */
export function NotificationBell() {
    const notifications = usePage<{ notifications?: SharedNotifications }>()
        .props.notifications;

    if (!notifications) {
        return null;
    }

    return <BellMenu notifications={notifications} />;
}

function BellMenu({
    notifications,
}: {
    notifications: NonNullable<SharedNotifications>;
}) {
    const { unread, items } = notifications;
    const [permission, setPermission] = useState(() =>
        supportsDesktopAlerts() ? Notification.permission : 'denied',
    );
    const seenIds = useRef(new Set(items.map((item) => item.id)));

    usePoll(POLL_MS, { only: ['notifications'] });

    // Pop a desktop notification for alerts that arrived since the last check.
    useEffect(() => {
        const fresh = items.filter(
            (item) => !item.read && !seenIds.current.has(item.id),
        );
        items.forEach((item) => seenIds.current.add(item.id));

        if (permission !== 'granted' || document.hasFocus()) {
            return;
        }

        fresh.forEach((item) => {
            const alert = new Notification(item.title, {
                body: item.body,
                tag: item.id,
            });
            alert.onclick = () => {
                window.focus();
                router.visit(item.open_url);
            };
        });
    }, [items, permission]);

    function enableDesktopAlerts(): void {
        Notification.requestPermission().then(setPermission);
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative rounded-full"
                    aria-label={
                        unread > 0
                            ? `Notifications, ${unread} unread`
                            : 'Notifications'
                    }
                >
                    <Bell />
                    {unread > 0 && (
                        <span className="absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] leading-4 font-bold text-brand-foreground tabular-nums">
                            {unread > 9 ? '9+' : unread}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0">
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <p className="text-sm font-semibold">Notifications</p>
                    {unread > 0 && (
                        <button
                            type="button"
                            className="text-xs font-medium text-brand hover:underline"
                            onClick={() =>
                                router.post(
                                    notifications.read_url,
                                    {},
                                    { preserveScroll: true },
                                )
                            }
                        >
                            Mark all read
                        </button>
                    )}
                </div>
                {permission === 'default' && (
                    <button
                        type="button"
                        onClick={enableDesktopAlerts}
                        className="flex w-full items-center gap-2 border-b bg-muted/40 px-4 py-2 text-left text-xs text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <BellRing className="size-3.5 text-brand" />
                        Get desktop alerts for new bookings
                    </button>
                )}
                {items.length > 0 ? (
                    <ul className="max-h-96 overflow-y-auto py-1">
                        {items.map((item) => {
                            const Icon = actionIcons[item.action] ?? Bell;

                            return (
                                <li key={item.id}>
                                    <Link
                                        href={item.open_url}
                                        className={cn(
                                            'flex gap-3 px-4 py-2.5 transition-colors hover:bg-muted/60',
                                            !item.read && 'bg-brand/5',
                                        )}
                                    >
                                        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                            <Icon className="size-3.5" />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="flex items-center gap-2 text-sm font-medium">
                                                <span className="truncate">
                                                    {item.title}
                                                </span>
                                                {!item.read && (
                                                    <span className="size-1.5 shrink-0 rounded-full bg-brand" />
                                                )}
                                            </span>
                                            <span className="block truncate text-xs text-muted-foreground">
                                                {item.body}
                                            </span>
                                            {item.created_at && (
                                                <span className="block text-[11px] text-muted-foreground/80">
                                                    {formatDistanceToNowStrict(
                                                        parseISO(
                                                            item.created_at,
                                                        ),
                                                        { addSuffix: true },
                                                    )}
                                                </span>
                                            )}
                                        </span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                        Nothing new. New requests, transfers, cancellations and
                        reviews show up here.
                    </p>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
