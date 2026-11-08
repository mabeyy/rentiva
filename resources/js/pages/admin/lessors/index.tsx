import { Head, Link } from '@inertiajs/react';
import { Users } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import Heading from '@/components/heading';
import { PaginationLinks } from '@/components/pagination-links';
import { SearchInput } from '@/components/search-input';
import { StatusBadge } from '@/components/status-badge';
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
import { formatDate } from '@/lib/format';
import admin from '@/routes/admin';
import type { Lessor, Paginated } from '@/types';

export default function AdminLessorsIndex({
    lessors,
    search,
}: {
    lessors: Paginated<Lessor>;
    search: string | null;
}) {
    const { apply } = useQueryFilters(admin.lessors.index(), { search });

    return (
        <>
            <Head title="Lessors" />

            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading
                        title="Lessors"
                        description="Car owners on the platform and their activity."
                    />
                    <SearchInput
                        value={search}
                        onSearch={(value) => apply({ search: value })}
                        placeholder="Search name, business or email"
                    />
                </div>

                {lessors.data.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead className="text-right">
                                    Cars
                                </TableHead>
                                <TableHead className="text-right">
                                    Bookings
                                </TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {lessors.data.map((lessor) => (
                                <TableRow key={lessor.id}>
                                    <TableCell>
                                        <div className="font-medium">
                                            {lessor.storefront?.name ??
                                                lessor.name}
                                        </div>
                                        {lessor.storefront && (
                                            <div className="text-xs text-muted-foreground">
                                                {lessor.name}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div>{lessor.email}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {lessor.phone ?? '—'}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {lessor.cars_count}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {lessor.bookings_count}
                                    </TableCell>
                                    <TableCell>
                                        {formatDate(
                                            lessor.created_at.slice(0, 10),
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge status={lessor.status} />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            asChild
                                        >
                                            <Link
                                                href={admin.lessors.show(
                                                    lessor.id,
                                                )}
                                            >
                                                View
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <EmptyState icon={Users} title="No lessors found" />
                )}
                <PaginationLinks paginated={lessors} />
            </div>
        </>
    );
}

AdminLessorsIndex.layout = {
    breadcrumbs: [{ title: 'Lessors', href: admin.lessors.index() }],
};
