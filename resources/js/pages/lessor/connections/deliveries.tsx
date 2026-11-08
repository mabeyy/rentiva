import { Link } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { CircleCheck, CircleX, Mail, MessageSquare, Send } from 'lucide-react';
import type { ConnectionContext } from '@/components/connections/connections-shell';
import {
    ConnectionsShell,
    NeedsBookingPage,
} from '@/components/connections/connections-shell';
import { EmptyState } from '@/components/empty-state';
import { OptionSelect } from '@/components/option-select';
import { Button } from '@/components/ui/button';
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

type Delivery = {
    id: number;
    channel: 'mail' | 'sms';
    recipient: string;
    summary: string;
    status: 'sent' | 'failed';
    error: string | null;
    reference: string | null;
    created_at: string | null;
};

type DeliveryPage = {
    data: Delivery[];
    from: number | null;
    to: number | null;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
};

/** Notification class names shown as plain words, e.g. "BookingStatusChanged". */
function describe(summary: string): string {
    return summary.replace(/([a-z])([A-Z])/g, '$1 $2');
}

export default function ConnectionDeliveries({
    deliveries,
    filters,
    ...context
}: ConnectionContext & {
    deliveries: DeliveryPage | null;
    filters: { channel?: string; status?: string };
}) {
    const { apply } = useQueryFilters(
        { url: context.urls.deliveries, method: 'get' },
        filters,
    );

    return (
        <ConnectionsShell
            context={context}
            description="Every email and text sent for your bookings, and whether it went through."
        >
            {!deliveries ? (
                <NeedsBookingPage />
            ) : (
                <>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <OptionSelect
                            options={[
                                { value: 'mail', label: 'Emails' },
                                { value: 'sms', label: 'Texts' },
                            ]}
                            value={filters.channel ?? null}
                            onChange={(channel) => apply({ channel })}
                            anyLabel="Emails and texts"
                            className="sm:w-48"
                        />
                        <OptionSelect
                            options={[
                                { value: 'sent', label: 'Sent' },
                                { value: 'failed', label: 'Failed' },
                            ]}
                            value={filters.status ?? null}
                            onChange={(status) => apply({ status })}
                            anyLabel="Any status"
                            className="sm:w-40"
                        />
                    </div>

                    {deliveries.data.length === 0 ? (
                        <EmptyState
                            icon={Send}
                            title="Nothing sent yet"
                            description="Emails and texts about your bookings will be listed here."
                        />
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Message</TableHead>
                                    <TableHead>To</TableHead>
                                    <TableHead>Booking</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">
                                        When
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {deliveries.data.map((delivery) => {
                                    const ChannelIcon =
                                        delivery.channel === 'sms'
                                            ? MessageSquare
                                            : Mail;
                                    const isSent = delivery.status === 'sent';

                                    return (
                                        <TableRow key={delivery.id}>
                                            <TableCell className="max-w-sm whitespace-normal">
                                                <span className="flex items-start gap-2">
                                                    <ChannelIcon className="mt-0.5 size-4 shrink-0 text-brand" />
                                                    <span>
                                                        {delivery.channel ===
                                                        'mail'
                                                            ? describe(
                                                                  delivery.summary,
                                                              )
                                                            : delivery.summary}
                                                        {delivery.error && (
                                                            <span className="mt-1 block text-xs text-destructive">
                                                                {delivery.error}
                                                            </span>
                                                        )}
                                                    </span>
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {delivery.recipient}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">
                                                {delivery.reference ?? '—'}
                                            </TableCell>
                                            <TableCell>
                                                <span
                                                    className={cn(
                                                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                                                        isSent
                                                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                                            : 'bg-destructive/10 text-destructive',
                                                    )}
                                                >
                                                    {isSent ? (
                                                        <CircleCheck className="size-3.5" />
                                                    ) : (
                                                        <CircleX className="size-3.5" />
                                                    )}
                                                    {isSent ? 'Sent' : 'Failed'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground tabular-nums">
                                                {delivery.created_at &&
                                                    format(
                                                        parseISO(
                                                            delivery.created_at,
                                                        ),
                                                        'MMM d · h:mm a',
                                                    )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}

                    {deliveries.total > 0 && (
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>
                                {deliveries.from}–{deliveries.to} of{' '}
                                {deliveries.total}
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-full"
                                    disabled={!deliveries.prev_page_url}
                                    asChild={Boolean(deliveries.prev_page_url)}
                                >
                                    {deliveries.prev_page_url ? (
                                        <Link
                                            href={deliveries.prev_page_url}
                                            preserveScroll
                                        >
                                            Previous
                                        </Link>
                                    ) : (
                                        <span>Previous</span>
                                    )}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-full"
                                    disabled={!deliveries.next_page_url}
                                    asChild={Boolean(deliveries.next_page_url)}
                                >
                                    {deliveries.next_page_url ? (
                                        <Link
                                            href={deliveries.next_page_url}
                                            preserveScroll
                                        >
                                            Next
                                        </Link>
                                    ) : (
                                        <span>Next</span>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </ConnectionsShell>
    );
}
