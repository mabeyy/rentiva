import { Link, router } from '@inertiajs/react';
import {
    ArrowUpRight,
    CalendarOff,
    ChevronRight,
    ImagePlus,
    Trash2,
} from 'lucide-react';
import CarSubmissionController from '@/actions/App/Http/Controllers/Lessor/CarSubmissionController';
import CarController from '@/actions/App/Http/Controllers/Lessor/CarController';
import { CarActivationSwitch } from '@/components/lessor/car-activation-switch';
import { StatusBadge } from '@/components/status-badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Button } from '@/components/ui/button';
import lessor from '@/routes/lessor';
import storefronts from '@/routes/storefronts';
import type { Car } from '@/types';

const statusHints: Record<string, string> = {
    draft: 'Only you can see this listing. Submit it when you are ready.',
    pending_review:
        'An admin is reviewing this listing. You can still make edits.',
    active: 'Live. Renters can find and book this car.',
    rejected: 'Fix the issues below and submit again.',
    suspended: 'An admin suspended this listing. Renters cannot see it.',
    inactive:
        'Hidden from renters. Switch it back on any time; no new review needed.',
};

/**
 * The car at a glance for the edit page's sidebar: cover photo, status with
 * the visibility switch, the next action (submit or view), blocked dates,
 * and delete.
 */
export function ListingStatusPanel({
    car,
    upcomingBlocksCount,
    hasBookings,
}: {
    car: Car;
    /** Upcoming blocked stretches, managed under Bookings → Blocked. */
    upcomingBlocksCount: number;
    /** Booked cars can't be deleted, only switched off. */
    hasBookings: boolean;
}) {
    const canSubmit =
        car.status.value === 'draft' || car.status.value === 'rejected';
    const cover = car.images?.[0]?.url;

    return (
        <section className="overflow-hidden rounded-3xl border bg-background">
            <div className="relative aspect-[16/10] bg-muted">
                {cover ? (
                    <img
                        src={cover}
                        alt={car.name}
                        className="size-full object-cover"
                    />
                ) : (
                    <a
                        href="#car-photos"
                        className="flex size-full flex-col items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                    >
                        <ImagePlus className="size-6" />
                        Add a cover photo
                    </a>
                )}
                <span className="absolute top-3 left-3">
                    <StatusBadge status={car.status} />
                </span>
            </div>

            <div className="space-y-4 p-5">
                <div className="space-y-2">
                    <CarActivationSwitch car={car} />
                    <p className="text-sm text-muted-foreground">
                        {statusHints[car.status.value]}
                    </p>
                </div>

                {car.rejection_reason && (
                    <Alert variant="destructive">
                        <AlertTitle>Admin feedback</AlertTitle>
                        <AlertDescription>
                            {car.rejection_reason}
                        </AlertDescription>
                    </Alert>
                )}

                <div className="grid gap-2">
                    {canSubmit && (
                        <Button
                            className="w-full rounded-full"
                            onClick={() =>
                                router.post(
                                    CarSubmissionController.store.url(car.slug),
                                    {},
                                    { preserveScroll: true },
                                )
                            }
                        >
                            Submit for review
                        </Button>
                    )}
                    {car.status.value === 'active' && car.storefront_slug && (
                        <Button
                            variant="outline"
                            className="w-full rounded-full"
                            asChild
                        >
                            <Link
                                href={storefronts.cars.show({
                                    storefront: car.storefront_slug,
                                    car: car.slug,
                                })}
                            >
                                View public page
                                <ArrowUpRight />
                            </Link>
                        </Button>
                    )}
                </div>

                <Link
                    href={lessor.bookings.blocked({
                        query: { car: car.slug },
                    })}
                    className="flex items-center gap-3 rounded-2xl bg-muted/50 px-3 py-2.5 text-sm transition-colors hover:bg-muted"
                >
                    <CalendarOff className="size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1">
                        <span className="block font-medium">
                            {upcomingBlocksCount > 0
                                ? `${upcomingBlocksCount} upcoming ${upcomingBlocksCount === 1 ? 'block' : 'blocks'}`
                                : 'No blocked dates'}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                            Days renters can't book, like maintenance
                        </span>
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>

                <div className="border-t pt-3">
                    {hasBookings ? (
                        <p className="text-xs text-muted-foreground">
                            This car has been booked, so it can't be deleted:
                            its trips, payments and reviews stay on record.
                            Switch it off above to hide it from renters.
                        </p>
                    ) : (
                        <ConfirmDialog
                            trigger={
                                <button
                                    type="button"
                                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive"
                                >
                                    <Trash2 className="size-4" /> Delete this
                                    car
                                </button>
                            }
                            title={`Delete ${car.name}?`}
                            description="The listing and its photos are removed permanently."
                            cancelLabel="Keep"
                            confirmLabel="Delete"
                            onConfirm={() =>
                                router.delete(
                                    CarController.destroy.url(car.slug),
                                )
                            }
                        />
                    )}
                </div>
            </div>
        </section>
    );
}
