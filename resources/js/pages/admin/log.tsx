import { Head } from '@inertiajs/react';
import { ScrollText } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '@/components/empty-state';
import Heading from '@/components/heading';
import { OptionSelect } from '@/components/option-select';
import { PaginationLinks } from '@/components/pagination-links';
import { TimeAgo } from '@/components/time-ago';
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
import admin from '@/routes/admin';
import type { Option, Paginated } from '@/types';

type LoggedAction = {
    id: number;
    admin_name: string;
    action: string;
    subject: string | null;
    details: string | null;
    created_at: string | null;
};

/**
 * What admins did and when, for the record: plan changes, suspensions,
 * listing decisions, invoices, reviews, settings and viewing as an owner.
 */
export default function AdminLog({
    actions,
    filters,
    actionOptions,
}: {
    actions: Paginated<LoggedAction>;
    filters: { action?: string; search?: string };
    actionOptions: Option[];
}) {
    const { apply } = useQueryFilters(admin.log(), filters);
    const [search, setSearch] = useState(filters.search ?? '');

    return (
        <>
            <Head title="Admin log" />

            <div className="space-y-6 p-4 md:p-6">
                <Heading
                    title="Admin log"
                    description="Everything admins changed and when: plans, suspensions, listings, invoices, reviews, settings, and viewing the app as an owner."
                />

                <div className="flex flex-wrap gap-2">
                    <OptionSelect
                        options={actionOptions}
                        value={filters.action ?? null}
                        anyLabel="Every action"
                        onChange={(value) => apply({ action: value })}
                        className="w-64"
                    />
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            apply({ search });
                        }}
                    >
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search admin, owner or invoice"
                            aria-label="Search the log"
                            className="w-72"
                        />
                    </form>
                </div>

                {actions.data.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>When</TableHead>
                                <TableHead>Admin</TableHead>
                                <TableHead>What</TableHead>
                                <TableHead>On</TableHead>
                                <TableHead>Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {actions.data.map((action) => (
                                <TableRow key={action.id}>
                                    <TableCell className="whitespace-nowrap text-muted-foreground">
                                        {action.created_at && (
                                            <TimeAgo date={action.created_at} />
                                        )}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {action.admin_name}
                                    </TableCell>
                                    <TableCell>{action.action}</TableCell>
                                    <TableCell>
                                        {action.subject ?? '–'}
                                    </TableCell>
                                    <TableCell className="max-w-72 truncate text-muted-foreground">
                                        {action.details ?? ''}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <EmptyState
                        icon={ScrollText}
                        title="Nothing logged yet"
                        description="Admin changes show up here as they happen."
                    />
                )}

                <PaginationLinks paginated={actions} />
            </div>
        </>
    );
}

AdminLog.layout = {
    breadcrumbs: [{ title: 'Admin log', href: admin.log() }],
};
