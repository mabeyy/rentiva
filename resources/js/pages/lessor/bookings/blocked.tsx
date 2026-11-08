import { Head, Link, router } from '@inertiajs/react';
import { parseISO } from 'date-fns';
import { CalendarOff, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import CarBlockController from '@/actions/App/Http/Controllers/Lessor/CarBlockController';
import type { BlockOptions } from '@/components/bookings/block-dates-dialog';
import {
    BlockDatesDialog,
    blockDayCount,
    blockPeriod,
} from '@/components/bookings/block-dates-dialog';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import { BookingsViewTabs } from '@/components/lessor/bookings-view-tabs';
import { PageHeader } from '@/components/lessor/page-header';
import { BrandButton } from '@/components/public/brand-button';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import lessor from '@/routes/lessor';
import type { CarBlock } from '@/types';

export default function LessorBookingsBlocked({
    blocks,
    carFilter,
    blockOptions,
}: {
    /** Upcoming blocks across the owner's cars, or one car's. */
    blocks: CarBlock[];
    /** Car slug when the list is narrowed to one car. */
    carFilter: string | null;
    blockOptions: BlockOptions;
}) {
    const [editing, setEditing] = useState<CarBlock | 'new' | null>(null);
    const filteredCar = blockOptions.cars.find((car) => car.slug === carFilter);

    return (
        <>
            <Head title="Blocked dates" />

            <div className="space-y-6 p-4 md:p-8">
                <PageHeader
                    eyebrow="Requests and trips"
                    title="Bookings"
                    description="Days renters can't book a car, like maintenance. The car stays on your booking page."
                    actions={<BookingsViewTabs active="blocked" />}
                />

                <div className="flex flex-wrap items-center justify-between gap-3">
                    {filteredCar ? (
                        <Link
                            href={lessor.bookings.blocked()}
                            className="flex items-center gap-1.5 rounded-full border bg-background py-1.5 pr-2.5 pl-3.5 text-sm font-medium hover:border-foreground/30"
                        >
                            {filteredCar.name}
                            <X className="size-3.5 text-muted-foreground" />
                            <span className="sr-only">Show all cars</span>
                        </Link>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            {blocks.length}{' '}
                            {blocks.length === 1 ? 'block' : 'blocks'} coming up
                        </p>
                    )}
                    {blockOptions.cars.length > 0 && (
                        <BrandButton
                            className="rounded-full"
                            onClick={() => setEditing('new')}
                        >
                            <Plus /> Block dates
                        </BrandButton>
                    )}
                </div>

                {blocks.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Car</TableHead>
                                <TableHead>Dates</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>Note</TableHead>
                                <TableHead className="text-right">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {blocks.map((block) => (
                                <TableRow key={block.id}>
                                    <TableCell className="font-medium">
                                        <span className="flex items-center gap-3">
                                            {block.car?.cover_image ? (
                                                <img
                                                    src={block.car.cover_image}
                                                    alt=""
                                                    className="size-9 shrink-0 rounded-lg object-cover"
                                                />
                                            ) : (
                                                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                                    <CalendarOff className="size-4" />
                                                </span>
                                            )}
                                            {block.car?.name}
                                        </span>
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                        {blockPeriod(block)}
                                        <div className="text-xs text-muted-foreground">
                                            {blockDayCount(
                                                parseISO(block.start_date),
                                                parseISO(block.end_date),
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>{block.reason.label}</TableCell>
                                    <TableCell className="max-w-xs truncate text-muted-foreground">
                                        {block.note ?? '—'}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                aria-label="Edit blocked dates"
                                                onClick={() =>
                                                    setEditing(block)
                                                }
                                            >
                                                <Pencil />
                                            </Button>
                                            <ConfirmDialog
                                                trigger={
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        aria-label="Remove blocked dates"
                                                    >
                                                        <Trash2 />
                                                    </Button>
                                                }
                                                title="Open these dates?"
                                                description={`Renters will be able to book the ${block.car?.name} on ${blockPeriod(block)} again.`}
                                                confirmLabel="Open dates"
                                                onConfirm={() =>
                                                    router.delete(
                                                        CarBlockController.destroy(
                                                            {
                                                                car: block.car!
                                                                    .slug,
                                                                block: block.id,
                                                            },
                                                        ).url,
                                                        {
                                                            preserveScroll: true,
                                                        },
                                                    )
                                                }
                                            />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <EmptyState
                        icon={CalendarOff}
                        title="No blocked dates coming up"
                        description="Block days when a car is in for maintenance or you're using it yourself, so renters can't book them."
                    />
                )}
            </div>

            <BlockDatesDialog
                open={editing !== null}
                onOpenChange={(isOpen) => !isOpen && setEditing(null)}
                block={editing === 'new' ? null : editing}
                initialCarSlug={carFilter}
                options={blockOptions}
            />
        </>
    );
}

LessorBookingsBlocked.layout = {
    breadcrumbs: [
        { title: 'Bookings', href: lessor.bookings.calendar() },
        { title: 'Blocked dates', href: lessor.bookings.blocked() },
    ],
};
