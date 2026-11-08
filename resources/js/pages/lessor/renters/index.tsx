import { Head, Link } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { AlertTriangle, ArrowUpRight, Download, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/lessor/page-header';
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
import { formatPeso } from '@/lib/format';
import { cn } from '@/lib/utils';
import lessor from '@/routes/lessor';
import type { Paginated } from '@/types';

type RenterRow = {
    key: string;
    name: string;
    phone: string;
    email: string | null;
    /** Numbers and emails beyond the first, matched to this renter. */
    contacts_count: number;
    bookings_count: number;
    cancelled_count: number;
    total_spent: number;
    last_start_date: string;
    flag: string | null;
};

type RenterFilters = { search?: string; flagged?: string };

export default function LessorRenters({
    renters,
    filters,
    flaggedCount,
}: {
    renters: Paginated<RenterRow>;
    filters: RenterFilters;
    flaggedCount: number;
}) {
    const { apply } = useQueryFilters(lessor.renters.index(), filters);
    const isFlaggedOnly = Boolean(Number(filters.flagged ?? 0));

    return (
        <>
            <Head title="Renters" />

            <div className="space-y-6 p-4 md:p-8">
                <PageHeader
                    eyebrow="Your customers"
                    title="Renters"
                    description="Everyone who has booked with you. Bookings with the same mobile number or email count as one renter. Flag anyone you'd rather not rent to again."
                />

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <SearchInput
                        value={filters.search}
                        onSearch={(search) => apply({ search: search || null })}
                        placeholder="Search name, phone or email"
                        className="w-full sm:w-80"
                    />
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            className="rounded-full"
                            asChild
                        >
                            <a href={lessor.renters.export().url}>
                                <Download /> Export CSV
                            </a>
                        </Button>
                        {[
                            { label: 'All renters', flagged: false },
                            {
                                label: `Flagged (${flaggedCount})`,
                                flagged: true,
                            },
                        ].map((tab) => (
                            <button
                                key={tab.label}
                                type="button"
                                aria-pressed={isFlaggedOnly === tab.flagged}
                                onClick={() =>
                                    apply({ flagged: tab.flagged ? '1' : null })
                                }
                                className={cn(
                                    'rounded-full border px-3.5 py-1.5 text-sm transition-colors',
                                    isFlaggedOnly === tab.flagged
                                        ? 'border-ink bg-ink text-ink-foreground'
                                        : 'text-muted-foreground hover:text-foreground',
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {renters.data.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Renter</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead className="text-right">
                                    Bookings
                                </TableHead>
                                <TableHead className="text-right">
                                    Spent
                                </TableHead>
                                <TableHead className="text-right">
                                    Last trip
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {renters.data.map((renter) => (
                                <TableRow key={renter.key}>
                                    <TableCell>
                                        <Link
                                            href={lessor.renters.show(
                                                renter.key,
                                            )}
                                            className="group inline-flex items-center gap-1 font-medium hover:underline"
                                        >
                                            {renter.name}
                                            <ArrowUpRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
                                        </Link>
                                        {renter.flag && (
                                            <p className="mt-0.5 flex max-w-xs items-center gap-1 truncate text-xs text-amber-700 dark:text-amber-400">
                                                <AlertTriangle className="size-3.5 shrink-0" />
                                                {renter.flag}
                                            </p>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="tabular-nums">
                                            {renter.phone}
                                        </div>
                                        {renter.email && (
                                            <div className="text-xs text-muted-foreground">
                                                {renter.email}
                                            </div>
                                        )}
                                        {renter.contacts_count > 2 && (
                                            <div className="text-xs text-muted-foreground">
                                                +{renter.contacts_count - 2}{' '}
                                                more contact
                                                {renter.contacts_count > 3
                                                    ? 's'
                                                    : ''}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">
                                        {renter.bookings_count}
                                        {renter.cancelled_count > 0 && (
                                            <div className="text-xs text-muted-foreground">
                                                {renter.cancelled_count}{' '}
                                                cancelled
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">
                                        {formatPeso(renter.total_spent)}
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground tabular-nums">
                                        {format(
                                            parseISO(renter.last_start_date),
                                            'MMM d, yyyy',
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <EmptyState
                        icon={Users}
                        title="No renters here"
                        description={
                            filters.search || isFlaggedOnly
                                ? 'Try a different search or filter.'
                                : 'Renters appear here once they book with you.'
                        }
                    />
                )}
                <PaginationLinks paginated={renters} />
            </div>
        </>
    );
}

LessorRenters.layout = {
    breadcrumbs: [{ title: 'Renters', href: lessor.renters.index() }],
};
