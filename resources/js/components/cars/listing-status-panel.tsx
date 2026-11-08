import { Link, router } from '@inertiajs/react';
import CarSubmissionController from '@/actions/App/Http/Controllers/Lessor/CarSubmissionController';
import CarController from '@/actions/App/Http/Controllers/Lessor/CarController';
import { CarActivationSwitch } from '@/components/lessor/car-activation-switch';
import { StatusBadge } from '@/components/status-badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
 * Listing status with the next action a lessor can take (submit, view, delete).
 */
export function ListingStatusPanel({ car }: { car: Car }) {
    const canSubmit =
        car.status.value === 'draft' || car.status.value === 'rejected';

    return (
        <Card>
            <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-3">
                            <StatusBadge status={car.status} />
                            <CarActivationSwitch car={car} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {statusHints[car.status.value]}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {car.status.value === 'active' &&
                            car.storefront_slug && (
                                <Button variant="outline" asChild>
                                    <Link
                                        href={storefronts.cars.show({
                                            storefront: car.storefront_slug,
                                            car: car.slug,
                                        })}
                                    >
                                        View public page
                                    </Link>
                                </Button>
                            )}
                        {canSubmit && (
                            <Button
                                onClick={() =>
                                    router.post(
                                        CarSubmissionController.store.url(
                                            car.slug,
                                        ),
                                        {},
                                        { preserveScroll: true },
                                    )
                                }
                            >
                                Submit for review
                            </Button>
                        )}
                        <ConfirmDialog
                            trigger={
                                <Button
                                    variant="ghost"
                                    className="text-destructive"
                                >
                                    Delete
                                </Button>
                            }
                            title={`Delete ${car.name}?`}
                            description="The listing and its photos are removed permanently. Cars with pending or confirmed bookings cannot be deleted."
                            cancelLabel="Keep"
                            confirmLabel="Delete"
                            onConfirm={() =>
                                router.delete(
                                    CarController.destroy.url(car.slug),
                                )
                            }
                        />
                    </div>
                </div>

                {car.rejection_reason && (
                    <Alert variant="destructive">
                        <AlertTitle>Admin feedback</AlertTitle>
                        <AlertDescription>
                            {car.rejection_reason}
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
}
